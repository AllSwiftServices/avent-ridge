import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, otp: string) {
  console.log(`🚀 Attempting to send OTP email via Resend to: ${to}`);

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 0; color: #e4e4e7; }
            .container { max-width: 600px; margin: 40px auto; background: #18181b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); border: 1px solid #27272a; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center; }
            .logo-circle { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; }
            .content { padding: 40px 30px; text-align: center; }
            .title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
            .text { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .otp-box { background: #27272a; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #3f3f46; }
            .otp-label { margin: 0; color: #a1a1aa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .otp-code { font-size: 42px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; margin: 16px 0; font-family: monospace; }
            .expiry { margin: 0; color: #71717a; font-size: 13px; }
            .footer { background: #09090b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #27272a; }
            .footer a { color: #3b82f6; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Avent Ridge</h1>
              <p>Premium Trading Platform</p>
            </div>
            <div class="content">
              <div class="title">Verify Your Email</div>
              <p class="text">Welcome to Avent Ridge! Please use the verification code below to complete your sign in.</p>
              <div class="otp-box">
                <p class="otp-label">Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p class="expiry">Valid for 10 minutes</p>
              </div>
              <p class="text" style="font-size: 14px; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Avent Ridge. All rights reserved.</p>
              <p>Trade with confidence on our secure platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

  try {
    const { data, error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || "Avent Ridge <noreply@aventridge.com>",
      to: [to],
      subject: "Verify Your Email - Avent Ridge",
      html,
    });

    if (error) {
      console.error(`❌ Resend failed to send email to ${to}:`, error);
      throw new Error(error.message);
    }

    console.log(
      `✅ OTP email sent successfully via Resend to ${to}. MessageId: ${data?.id}`,
    );
    return data;
  } catch (error: any) {
    console.error(`❌ Resend failed to send email to ${to}:`, error.message);
    throw error;
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  console.log(`🚀 Sending welcome email to: ${to}`);

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 0; color: #e4e4e7; }
            .container { max-width: 600px; margin: 40px auto; background: #18181b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); border: 1px solid #27272a; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; }
            .content { padding: 40px 30px; text-align: center; }
            .title { font-size: 24px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
            .text { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { background: #09090b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #27272a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Avent Ridge!</h1>
            </div>
            <div class="content">
              <div class="title">Hi ${name},</div>
              <p class="text">Thank you for joining Avent Ridge! You're now part of our community of elite traders.</p>
              
              <div class="features">
                <div class="feature"><span class="feature-icon">✓</span> Advanced trading tools & real-time analytics</div>
                <div class="feature"><span class="feature-icon">✓</span> Access global markets effortlessly</div>
                <div class="feature"><span class="feature-icon">✓</span> Secure platform and funds protection</div>
              </div>

              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aventridge.com"}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Avent Ridge. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

  try {
    const { data, error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || "Avent Ridge <noreply@aventridge.com>",
      to: [to],
      subject: "Welcome to Avent Ridge! 🎉",
      html,
    });

    if (error) {
      console.error(`❌ Failed to send welcome email to ${to}:`, error);
      return null;
    }

    console.log(`✅ Welcome email sent to ${to}. MessageId: ${data?.id}`);
    return data;
  } catch (error: any) {
    console.error(`❌ Error sending welcome email:`, error.message);
    return null;
  }
}
