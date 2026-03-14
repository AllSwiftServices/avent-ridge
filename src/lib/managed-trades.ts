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
      const stakeAmount = Number(stake.stake_amount);
      const profitAmount = (stakeAmount * Number(trade.profit_percent)) / 100;
      const totalPayout = stakeAmount + profitAmount;

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

      // Mark stake as paid out
      await supabaseAdmin
        .from("managed_trade_stakes")
        .update({ 
          status: "paid_out",
          paid_out_at: new Date().toISOString()
        })
        .eq("id", stake.id);

      // Log transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: stake.user_id,
        amount: totalPayout,
        type: "managed_trade_payout",
        status: "completed",
        description: `Payout from ${trade.asset_symbol} managed trade (+${trade.profit_percent}% profit)`
      });

      // 4. Notify User
      try {
        const { sendPushNotification } = await import("./push-notifications");
        await sendPushNotification(stake.user_id, {
          title: "Trade Payout Received",
          body: `Your $${stakeAmount.toLocaleString()} stake in ${trade.asset_symbol} has matured! $${totalPayout.toLocaleString()} has been credited to your trading wallet.`,
          url: "/wallet"
        });
      } catch (pushErr) {
        console.error("Failed to send payout notification:", pushErr);
      }

      results.paidOut++;
    } catch (e) {
      console.error(`Failed to pay out stake ${stake.id}:`, e);
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
