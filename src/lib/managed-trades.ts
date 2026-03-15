import { supabaseAdmin } from "./supabase-server";

export async function processTradePayout(tradeId: string) {
  // 1. Fetch trade
  const { data: trade, error: tradeErr } = await supabaseAdmin
    .from("managed_trades")
    .select("*")
    .eq("id", tradeId)
    .single();

  if (tradeErr || !trade) throw new Error("Trade not found");
  if (trade.status !== "active") throw new Error("Trade is not active");

  // 2. Fetch all active stakes for this trade
  const { data: stakes, error: stakesErr } = await supabaseAdmin
    .from("managed_trade_stakes")
    .select("*")
    .eq("trade_id", tradeId)
    .eq("status", "active");

  if (stakesErr) throw stakesErr;

  const results = {
    totalStakers: stakes?.length || 0,
    paidOut: 0,
    failed: 0
  };

  if (!stakes || stakes.length === 0) {
    // No stakes, just mark trade as completed
    await supabaseAdmin
      .from("managed_trades")
      .update({ status: "completed" })
      .eq("id", tradeId);
    return results;
  }

  // 3. Process each stake
  for (const stake of stakes) {
    try {
      const isWin = trade.outcome !== 'loss';
      const stakeAmount = Number(stake.stake_amount);
      const profitAmount = isWin ? (stakeAmount * Number(trade.profit_percent)) / 100 : 0;
      const totalPayout = isWin ? stakeAmount + profitAmount : 0;

      if (isWin) {
        // Credit user's wallet
        const { data: wallet, error: walletErr } = await supabaseAdmin
          .from("wallets")
          .select("*")
          .eq("user_id", stake.user_id)
          .eq("currency", "trading")
          .single();

        if (walletErr || !wallet) throw new Error(`Wallet not found for user ${stake.user_id}`);

        const { error: creditErr } = await supabaseAdmin
          .from("wallets")
          .update({ main_balance: Number(wallet.main_balance) + totalPayout })
          .eq("id", wallet.id);

        if (creditErr) throw creditErr;

        // Log transaction
        await supabaseAdmin.from("transactions").insert({
          user_id: stake.user_id,
          amount: totalPayout,
          type: "managed_trade_payout",
          status: "completed",
          description: `Payout from ${trade.asset_symbol} managed trade (+${trade.profit_percent}% profit)`
        });
      }

      // Mark stake as processed (paid_out if win, lost if loss)
      await supabaseAdmin
        .from("managed_trade_stakes")
        .update({ 
          status: isWin ? "paid_out" : "lost",
          paid_out_at: new Date().toISOString()
        })
        .eq("id", stake.id);

      if (!isWin) {
        // Log loss transaction for clarity (optional, but good for history)
        await supabaseAdmin.from("transactions").insert({
          user_id: stake.user_id,
          amount: 0,
          type: "managed_trade_loss",
          status: "completed",
          description: `Managed trade on ${trade.asset_symbol} ended in loss`
        });
      }

      // 4. Notify User
      try {
        const { sendPushNotification } = await import("./push-notifications");
        await sendPushNotification(stake.user_id, {
          title: isWin ? "Trade Payout Received" : "Trade Result: Loss",
          body: isWin 
            ? `Your $${stakeAmount.toLocaleString()} stake in ${trade.asset_symbol} has matured! $${totalPayout.toLocaleString()} has been credited to your trading wallet.`
            : `Your $${stakeAmount.toLocaleString()} stake in ${trade.asset_symbol} managed trade has expired in a loss.`,
          url: "/wallet"
        });
      } catch (pushErr) {
        console.error("Failed to send payout notification:", pushErr);
      }

      results.paidOut++;
    } catch (e) {
      console.error(`Failed to process stake ${stake.id}:`, e);
      results.failed++;
    }
  }

  // 4. Mark trade as completed
  await supabaseAdmin
    .from("managed_trades")
    .update({ status: "completed" })
    .eq("id", tradeId);

  return results;
}
