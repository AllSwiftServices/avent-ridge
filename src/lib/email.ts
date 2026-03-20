import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error("Missing SMTP configuration. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment variables.");
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }
  return transporter;
}

export async function sendOtpEmail(to: string, otp: string) {
  console.log(`🚀 Attempting to send OTP email via SMTP to: ${to}`);

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
              <h1>AR Trading</h1>
              <p>Premium Trading Platform</p>
            </div>
            <div class="content">
              <div class="title">Verify Your Email</div>
              <p class="text">Welcome to AR Trading! Please use the verification code below to complete your sign in.</p>
              <div class="otp-box">
                <p class="otp-label">Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p class="expiry">Valid for 10 minutes</p>
              </div>
              <p class="text" style="font-size: 14px; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AR Trading. All rights reserved.</p>
              <p>Trade with confidence on our secure platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Verify Your Email - AR Trading",
      html,
    });

    console.log(`✅ OTP email sent successfully via SMTP to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`❌ SMTP failed to send email to ${to}:`, error.message);
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
              <h1>🎉 Welcome to AR Trading!</h1>
            </div>
            <div class="content">
              <div class="title">Hi ${name},</div>
              <p class="text">Thank you for joining AR Trading! You're now part of our community of elite traders.</p>
              
              <div class="features">
                <p>✓ Advanced trading tools & real-time analytics</p>
                <p>✓ Access global markets effortlessly</p>
                <p>✓ Secure platform and funds protection</p>
              </div>

              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aventridge.com"}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AR Trading. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Welcome to AR Trading! 🎉",
      html,
    });

    console.log(`✅ Welcome email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`❌ Error sending welcome email to ${to}:`, error.message);
    return null;
  }
}
