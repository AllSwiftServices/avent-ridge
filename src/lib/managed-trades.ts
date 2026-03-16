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

  // 2. Fetch all active positions for this signal
  const { data: userPositions, error: userPositionsErr } = await supabaseAdmin
    .from("managed_trade_stakes")
    .select("*")
    .eq("trade_id", tradeId)
    .eq("status", "active");

  if (userPositionsErr) throw userPositionsErr;

  const results = {
    totalTraders: userPositions?.length || 0,
    paidOut: 0,
    failed: 0
  };

  if (!userPositions || userPositions.length === 0) {
    // No traders, just mark trade as completed
    await supabaseAdmin
      .from("managed_trades")
      .update({ status: "completed" })
      .eq("id", tradeId);
    return results;
  }

  // 3. Process each trade position
  for (const tradePosition of userPositions) {
    try {
      // Determine actual market direction
      // If signal was 'call' and outcome was 'win', market moved 'call'
      // If signal was 'call' and outcome was 'loss', market moved 'put'
      // If signal was 'put' and outcome was 'win', market moved 'put'
      // If signal was 'put' and outcome was 'loss', market moved 'call'
      const marketDirection = trade.signal_type === 'call' 
        ? (trade.outcome === 'win' ? 'call' : 'put')
        : (trade.outcome === 'win' ? 'put' : 'call');

      const isWin = tradePosition.direction === marketDirection;
      const tradeAmount = Number(tradePosition.stake_amount);
      const profitAmount = isWin ? (tradeAmount * Number(trade.profit_percent)) / 100 : 0;
      const totalPayout = isWin ? tradeAmount + profitAmount : 0;

      if (isWin) {
        // Credit user's wallet
        const { data: wallet, error: walletErr } = await supabaseAdmin
          .from("wallets")
          .select("*")
          .eq("user_id", tradePosition.user_id)
          .eq("currency", "trading")
          .single();

        if (walletErr || !wallet) throw new Error(`Wallet not found for user ${tradePosition.user_id}`);

        const { error: creditErr } = await supabaseAdmin
          .from("wallets")
          .update({ 
            main_balance: Number(wallet.main_balance) + totalPayout,
            available_balance: Number(wallet.available_balance) + totalPayout
          })
          .eq("id", wallet.id);

        if (creditErr) throw creditErr;

        // Log transaction
        await supabaseAdmin.from("transactions").insert({
          user_id: tradePosition.user_id,
          amount: totalPayout,
          total_value: totalPayout,
          type: "managed_trade_payout",
          status: "completed",
          description: `Payout from ${trade.asset_symbol} managed trade (+${trade.profit_percent}% profit)`
        });
      }

      // Mark position as processed (paid_out if win, lost if loss)
      await supabaseAdmin
        .from("managed_trade_stakes")
        .update({ 
          status: isWin ? "paid_out" : "lost",
          paid_out_at: new Date().toISOString()
        })
        .eq("id", tradePosition.id);

      if (!isWin) {
        // Log loss transaction for clarity
        await supabaseAdmin.from("transactions").insert({
          user_id: tradePosition.user_id,
          amount: 0,
          total_value: tradeAmount,
          type: "managed_trade_loss",
          status: "completed",
          description: `Managed trade on ${trade.asset_symbol} ended in loss`
        });
      }

      // 4. Notify User
      try {
        const { sendPushNotification } = await import("./push-notifications");
        await sendPushNotification(tradePosition.user_id, {
          title: isWin ? "Trade Payout Received" : "Trade Result: Loss",
          body: isWin 
            ? `Your $${tradeAmount.toLocaleString()} trade in ${trade.asset_symbol} has matured! $${totalPayout.toLocaleString()} has been credited to your trading wallet.`
            : `Your $${tradeAmount.toLocaleString()} trade in ${trade.asset_symbol} managed trade has expired in a loss.`,
          url: "/wallet"
        });
      } catch (pushErr) {
        console.error("Failed to send payout notification:", pushErr);
      }

      results.paidOut++;
    } catch (e) {
      console.error(`Failed to process position ${tradePosition.id}:`, e);
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
