import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase-server";

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

    // Only the user themselves or an admin may fetch full details
    const { data: callerProfile } = await supabase.from("users").select("role").eq("id", user.id).single();
    const isAdmin = callerProfile?.role === "admin";
    if (user.id !== id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch user profile
    const { data: profile, error } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
    if (error) throw error;

    // For admin, also fetch wallets + holdings
    if (isAdmin) {
      const [{ data: wallets }, { data: holdings }, { data: kyc }] = await Promise.all([
        supabaseAdmin.from("wallets").select("*").eq("user_id", id),
        supabaseAdmin.from("holdings").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabaseAdmin.from("kyc").select("*").eq("user_id", id).order("updated_at", { ascending: false }).limit(1),
      ]);
      return NextResponse.json({ ...profile, wallets: wallets || [], holdings: holdings || [], kyc: kyc?.[0] || null });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("User fetch error:", error);
    return NextResponse.json({ message: error.message || "Failed to fetch user" }, { status: 500 });
  }
}


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const supabase = await createClient();
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    // Only allow updating own profile or admin updating anyone
    if (currentUser.id !== id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // Safety check: only admins can update roles
    if (body.role && profile?.role !== "admin") {
      delete body.role;
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("User update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Allow users to update their own profile, or admins to update anyone
    const { data: callerProfile } = await supabaseAdmin.from("users").select("role").eq("id", user.id).single();
    const isAdmin = callerProfile?.role === "admin";

    if (user.id !== id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    // 1. Update public.users table (use admin client to bypass RLS)
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Update Auth metadata as well to keep in sync
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { user_metadata: { full_name: name } }
    );

    if (authUpdateError) {
      console.warn("Failed to update auth metadata:", authUpdateError);
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("User update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
