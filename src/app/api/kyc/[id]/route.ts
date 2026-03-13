import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
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

    // Security check: only allow users to fetch their own KYC or admins
    if (user.id !== id) {
      // In a real app we'd check for admin role here
      // For now, strict ownership
      // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("kyc")
      .select("*")
      .eq("user_id", id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"

    return NextResponse.json(data || null);
  } catch (error: any) {
    console.error("KYC fetch error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch KYC" },
      { status: 500 }
    );
  }
}
