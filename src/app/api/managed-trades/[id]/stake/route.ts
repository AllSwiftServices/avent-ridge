import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase-server";

// POST /api/managed-trades/[id]/stake — User stakes in a trade
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tradeId = id;
    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid stake amount" }, { status: 400 });
    }

    // 1. Fetch trade details and check validity
    const { data: trade, error: tradeErr } = await supabaseAdmin
      .from("managed_trades")
      .select("*")
      .eq("id", tradeId)
      .single();

    if (tradeErr || !trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (trade.status !== "active") {
      return NextResponse.json({ error: "Trade is no longer active" }, { status: 400 });
    }

    if (new Date(trade.ends_at) <= new Date()) {
      return NextResponse.json({ error: "Trade has expired" }, { status: 400 });
    }

    if (amount < trade.min_stake) {
      return NextResponse.json({ error: `Minimum stake is $${trade.min_stake}` }, { status: 400 });
    }

    // Check if user is eligible (if scoped to user)
    if (trade.scope === "user" && trade.target_user_id !== user.id) {
      return NextResponse.json({ error: "You are not eligible for this trade" }, { status: 403 });
    }

    // 2. Check user holding balance
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("currency", "USD")
      .single();

    if (walletErr || !wallet || Number(wallet.main_balance) < amount) {
      return NextResponse.json({ error: "Insufficient holding balance" }, { status: 400 });
    }

    // 3. Perform transaction: Deduct balance + Create stake
    // Note: In a real production app, use a DB transaction/RPC for atomicity.
    const { error: deductErr } = await supabaseAdmin
      .from("wallets")
      .update({ main_balance: Number(wallet.main_balance) - amount })
      .eq("id", wallet.id);

    if (deductErr) throw deductErr;

    const { data: stake, error: stakeErr } = await supabaseAdmin
      .from("managed_trade_stakes")
      .insert({
        trade_id: tradeId,
        user_id: user.id,
        stake_amount: amount
      })
      .select()
      .single();

    if (stakeErr) {
      // Rollback balance if stake record fails
      await supabaseAdmin
        .from("wallets")
        .update({ main_balance: Number(wallet.main_balance) })
        .eq("id", wallet.id);
      throw stakeErr;
    }

    // Log transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      amount: -amount,
      type: "managed_trade_stake",
      status: "completed",
      description: `Stake in ${trade.asset_symbol} managed trade`
    });

    return NextResponse.json(stake);
  } catch (error: any) {
    console.error("Staking error:", error);
    return NextResponse.json({ message: error.message || "Failed to stake" }, { status: 500 });
  }
}
