import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";

// Note: We use supabaseServer for admin operations if needed,
// but here we mostly use the standard client for DB ops.
// Actually, for user creation we might need the service role.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, type = "login", name } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP from verification_codes table
    const { data: otpRecord, error: otpError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", otp)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 401 },
      );
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase
        .from("verification_codes")
        .delete()
        .eq("email", normalizedEmail);

      return NextResponse.json(
        {
          success: false,
          error: "Verification code has expired. Please request a new one.",
        },
        { status: 401 },
      );
    }

    // Delete used OTP
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", normalizedEmail);

    // Get or create user profile
    let user;
    const { data: existingUser, error: userFetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ email_verified: true })
        .eq("id", existingUser.id)
        .select()
        .single();

      user = updateError ? existingUser : updatedUser;
    } else if (type === "signup") {
      // Create new auth user
      const { data: newAuthData, error: authCreateError } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: { name: name },
        });

      let userId;
      if (authCreateError) {
        // If user already exists in Auth but not in public.users, we might get an error.
        if (
          authCreateError.message
            .toLowerCase()
            .includes("already registered") ||
          authCreateError.message.toLowerCase().includes("already exists")
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Account already exists. Please login instead.",
            },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { success: false, error: authCreateError.message },
          { status: 500 },
        );
      }
      userId = newAuthData.user.id;

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          email_verified: true,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { success: false, error: "Failed to create profile" },
          { status: 500 },
        );
      }

      // Create default wallet
      await supabase.from("wallets").insert({
        user_id: userId,
        currency: "USD",
        main_balance: 0,
        available_balance: 0,
      });

      user = newUser;
      sendWelcomeEmail(normalizedEmail, user.name || "there").catch(
        console.error,
      );
    } else {
      return NextResponse.json(
        { success: false, error: "No account found. Please sign up first." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 },
    );
  }
}
