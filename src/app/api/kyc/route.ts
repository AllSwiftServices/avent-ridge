import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Logic: If KYC already exists, update it. Otherwise insert.
    // Upsert works well here.
    const { data, error } = await supabase
      .from("kyc")
      .upsert({
        ...body,
        user_id: user.id,
        user_email: user.email,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("KYC submission error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to submit KYC" },
      { status: 500 }
    );
  }
}
