import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendPushToAdmins } from "@/lib/push-notifications";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("support_conversations")
      .select("*, support_messages(id, body, sender_role, created_at)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { subject = "Support Request", message } = body;

    // Create the conversation
    const { data: conv, error: convError } = await supabaseAdmin
      .from("support_conversations")
      .insert({ user_id: user.id, subject })
      .select()
      .single();

    if (convError) throw convError;

    // Insert the first message if provided
    if (message) {
      await supabaseAdmin.from("support_messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        sender_role: "user",
        body: message,
      });

      // Notify admins — fire and forget
      sendPushToAdmins({
        title: "New Support Request",
        body: `${user.email}: ${message.slice(0, 100)}${message.length > 100 ? "..." : ""}`,
        url: "/admin/support",
      }).catch((e) => console.error("Failed to notify admins", e));
    }

    return NextResponse.json({ data: conv });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
