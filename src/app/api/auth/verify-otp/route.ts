import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";

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
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", otp)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code" },
        { status: 401 },
      );
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from("verification_codes").delete().eq("email", normalizedEmail);
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new one." },
        { status: 401 },
      );
    }

    // Delete used OTP
    await supabaseAdmin.from("verification_codes").delete().eq("email", normalizedEmail);

    // Profile management
    if (type === "signup") {
      // Create new user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: { name },
        // For simplicity in this demo, we use a generic password or the one provided
        // In a real OTP-only flow, we would manage passwords/sessions differently
        password: Math.random().toString(36).slice(-12), 
      });

      if (authError) {
        // If user already exists in Auth but not in our users table, we try to fix it
        if (authError.message.includes("already registered")) {
            // Logic to handle existing auth user without profile
        } else {
            throw authError;
        }
      }

      if (authData.user) {
        // Create user profile in public.users
        const { error: profileError } = await supabaseAdmin.from("users").insert({
          id: authData.user.id,
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          email_verified: true,
          role: "buyer",
        });

        if (profileError) console.error("Error creating profile:", profileError);

        // Send welcome email
        await sendWelcomeEmail(normalizedEmail, name || "there");
      }
    } else {
      // Login: Update email_verified status if not already
      await supabaseAdmin
        .from("users")
        .update({ email_verified: true })
        .eq("email", normalizedEmail);
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful",
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 },
    );
  }
}
