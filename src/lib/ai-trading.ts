import { supabaseAdmin } from "./supabase-server";

export async function resolveAiTrade(tradeId: string) {
  // 1. Fetch the pending trade
  const { data: trade, error: tradeError } = await supabaseAdmin
    .from("ai_trades")
    .select("*")
    .eq("id", tradeId)
    .single();

  if (tradeError || !trade) throw new Error("Trade not found");
  if (trade.status !== "pending") throw new Error("Trade already resolved");

  // 2. Determine outcome and payout
  const isWin = trade.outcome === "WIN";
  const totalPayout = isWin ? trade.stake + trade.profit : 0;

  // 3. Mark trade as resolved
  const { error: updateTradeError } = await supabaseAdmin
    .from("ai_trades")
    .update({ 
      status: "resolved", 
      resolved_at: new Date().toISOString() 
    })
    .eq("id", tradeId);

  if (updateTradeError) throw updateTradeError;

  // 4. Record Transaction and Update Wallet if Win
  if (isWin) {
    // Record Win Transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: trade.user_id,
      type: "trade_win",
      amount: totalPayout,
      symbol: "AI-PROFT",
      price: trade.entry_price || 0,
      status: "completed"
    });

    // Update Wallet
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("main_balance, available_balance")
      .eq("user_id", trade.user_id)
      .eq("currency", "trading")
      .single();
    
    if (wallet) {
      await supabaseAdmin.from("wallets").update({
        main_balance: wallet.main_balance + totalPayout,
        available_balance: wallet.available_balance + totalPayout
      }).eq("user_id", trade.user_id).eq("currency", "trading");
    }
  } else {
    // Record Loss Transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: trade.user_id,
      type: "trade_loss",
      amount: 0,
      symbol: "AI-LOST",
      price: trade.entry_price || 0,
      status: "completed"
    });
  }

  return { outcome: trade.outcome, profit: trade.profit };
}
