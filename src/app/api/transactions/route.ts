import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, price, symbol, asset_id, total_value } = body;

    // 1. Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        asset_id,
        symbol,
        type,
        amount,
        price,
        total_value,
        status: "completed",
      })
      .select()
      .single();

    if (txError) throw txError;

    // 2. Update wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError) throw walletError;

    let newBalance = wallet.main_balance;
    if (type === "deposit" || type === "sell") {
      newBalance += total_value;
    } else if (type === "withdraw" || type === "buy") {
      newBalance -= total_value;
    }

    const { error: updateError } = await supabase
      .from("wallets")
      .update({ 
        main_balance: newBalance,
        available_balance: newBalance 
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process transaction" },
      { status: 500 }
    );
  }
}
