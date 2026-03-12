import { NextRequest, NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { supabase } from "@/lib/supabase";

// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type = "login" } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists for login
    if (type === "login") {
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("email", normalizedEmail)
        .single();

      if (userError || !existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "No account found with this email. Please register first.",
          },
          { status: 404 },
        );
      }
    }

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing codes for this email first
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", normalizedEmail);

    // Store OTP in verification_codes table
    const { error: otpError } = await supabase
      .from("verification_codes")
      .insert({
        email: normalizedEmail,
        code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return NextResponse.json(
        { success: false, error: "Failed to generate verification code" },
        { status: 500 },
      );
    }

    // Send OTP email
    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (emailError: any) {
      console.error("Email send error:", emailError);
      // In development, continue even if email fails (log the OTP)
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] OTP for ${normalizedEmail}: ${otp}`);
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to send verification email. Please try again.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send verification code",
      },
      { status: 500 },
    );
  }
}
