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
        }

        await sendWelcomeEmail(normalizedEmail, name || "there");
      }
    } else {
      console.log(`[AUTH] Login successful for: ${normalizedEmail}`);
      await supabaseAdmin
        .from("users")
        .update({ email_verified: true })
        .eq("email", normalizedEmail);
    }

    // ───────────────────────────────────────────────────────────────────────
    // Set session cookies WITHOUT needing the user's password.
    // Strategy: generate a Supabase magic-link token via admin API, exchange
    // it for a real session, then store the session via the SSR client so the
    // Next.js cookies() store gets the auth cookies written to the response.
    // ───────────────────────────────────────────────────────────────────────
    try {
      // 1. Generate a one-time magic link token for this email
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        throw new Error(linkError?.message || "Failed to generate auth token");
      }

      const hashedToken = linkData.properties.hashed_token;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // 2. Exchange the magic-link token for a real Supabase session
      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({ type: "magiclink", token: hashedToken }),
      });

      if (!verifyRes.ok) {
        const errBody = await verifyRes.text();
        throw new Error(`Token exchange failed: ${errBody}`);
      }

      const sessionData = await verifyRes.json();
      const { access_token, refresh_token } = sessionData;

      if (!access_token || !refresh_token) {
        throw new Error("Token exchange returned no session");
      }

      // 3. Store the session via the SSR client so cookies are written to the response
      const supabase = await createClient();
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (setSessionError) {
        throw new Error(setSessionError.message);
      }

      console.log(`[AUTH] Session cookies set for ${normalizedEmail} via magic-link exchange`);
      return NextResponse.json({ success: true, message: "Verification successful" });
    } catch (sessionErr: any) {
      console.error(`[AUTH] Session setup error for ${normalizedEmail}:`, sessionErr);
      // OTP was valid — don't fail the whole request, just warn
      // The client retry loop will still try to confirm the session
      return NextResponse.json({ success: true, message: "Verification successful" });
    }
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 },
    );
  }
}
