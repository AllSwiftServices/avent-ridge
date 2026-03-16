import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, createClient } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, type = "login", name, password } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[AUTH] Verifying OTP for: ${normalizedEmail}`);

    // Verify OTP from verification_codes table
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", otp)
      .maybeSingle();

    if (otpError) {
      console.error(`[AUTH] Database error checking OTP for ${normalizedEmail}:`, otpError);
      return NextResponse.json(
        { success: false, error: "Database error. Please try again later." },
        { status: 500 },
      );
    }

    if (!otpRecord) {
      console.warn(`[AUTH] Invalid OTP attempt for ${normalizedEmail}: ${otp}`);
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
      console.log(`[AUTH] Creating new user for signup: ${normalizedEmail}`);
      // Create new user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: { name },
        password: password || Math.random().toString(36).slice(-12),
      });

      if (authError) {
        console.error(`[AUTH] Error creating auth user for ${normalizedEmail}:`, authError);
        throw authError;
      }
      if (authData.user) {
        console.log(`[AUTH] Auth user created: ${authData.user.id}. Creating profile...`);
        const { error: profileError } = await supabaseAdmin.from("users").insert({
          id: authData.user.id,
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          email_verified: true,
          role: "buyer",
        });

        if (profileError) {
          console.error(`[AUTH] Error creating profile for ${authData.user.id}:`, profileError);
        } else {
          console.log(`[AUTH] Profile created successfully for ${authData.user.id}`);
        }

        // Send welcome email
        await sendWelcomeEmail(normalizedEmail, name || "there");
      }
    } else {
      console.log(`[AUTH] Login successful for: ${normalizedEmail}`);
      // Update email_verified status if not already
      await supabaseAdmin
        .from("users")
        .update({ email_verified: true })
        .eq("email", normalizedEmail);
    }

    // Set session cookies via createClient() so Next.js SSR cookies() integration propagates them
    if (password) {
      try {
        // createClient() at the top level of the route handler so its cookie writes land in the response
        const supabase = await createClient();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password,
        });

        if (signInError) {
          console.error(`[AUTH] Error setting session for ${normalizedEmail}:`, signInError);
          // Session couldn't be set but OTP was valid — return success anyway
          // The user will need to be prompted to re-try or we rely on the token approach
        } else {
          console.log(`[AUTH] Session cookies set for ${normalizedEmail}`);
          // Return the access token so the client can store it as a fallback
          return NextResponse.json({
            success: true,
            message: "Verification successful",
            session: {
              access_token: signInData.session?.access_token,
              refresh_token: signInData.session?.refresh_token,
              expires_at: signInData.session?.expires_at,
            },
          });
        }
      } catch (err) {
        console.error(`[AUTH] Unexpected error during server-side sign-in:`, err);
      }
    } else {
      console.warn(`[AUTH] No password provided for ${normalizedEmail} — cannot set session cookies.`);
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
