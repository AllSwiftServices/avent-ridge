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
      .from("wallets")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    // If no wallet exists, create a default one for the user
    if (!data || data.length === 0) {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({
          user_id: user.id,
          currency: "USD",
          main_balance: 10000,
          available_balance: 10000,
        })
        .select();

      if (createError) throw createError;
      return NextResponse.json(newWallet);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fetch wallets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
