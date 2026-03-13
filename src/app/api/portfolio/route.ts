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
      .from("portfolio")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fetch portfolio error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}
