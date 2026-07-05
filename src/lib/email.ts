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

/**
 * Parses basic Markdown syntax to clean, inline-styled HTML suitable for email clients.
 * Supports: #, ##, ### headers, **bold**, *italic*, [link](url), lists, hr, and paragraph wraps.
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  // Safe HTML escapes to prevent layout breaking
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text** or __text__)
  html = html.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>");

  // Italic (*text* or _text_)
  html = html.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");

  // Headers (e.g. ### Header)
  html = html.replace(/^### (.*?)$/gm, '<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: bold; color: #111827; font-family: Arial, sans-serif;">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 style="margin-top: 24px; margin-bottom: 12px; font-size: 20px; font-weight: bold; color: #111827; font-family: Arial, sans-serif;">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 style="margin-top: 24px; margin-bottom: 12px; font-size: 24px; font-weight: bold; color: #111827; font-family: Arial, sans-serif;">$1</h1>');

  // Horizontal rules (---)
  html = html.replace(/^---$/gm, '<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />');

  // Links ([text](url))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #f97316; text-decoration: underline; font-weight: 600;">$1</a>');

  // Bullet list items (starting with * or - or +)
  html = html.replace(/^\s*[-*+]\s+(.*?)$/gm, '<li style="margin-bottom: 6px; color: #4b5563; font-family: Arial, sans-serif; font-size: 15px;">$1</li>');
  
  // Wrap adjacent <li> tags in a <ul> tag
  html = html.replace(/(<li.*?>.*?<\/li>\n?)+/g, (match) => {
    return `<ul style="margin-top: 8px; margin-bottom: 16px; padding-left: 20px; list-style-type: disc;">${match}</ul>`;
  });

  // Paragraph blocks
  const blocks = html.split(/\n\n+/);
  const formattedBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<hr") || trimmed.startsWith("<li")) {
      return trimmed.replace(/\n/g, "<br />");
    }
    const withBrs = trimmed.replace(/\n/g, "<br />");
    return `<p style="margin: 0 0 16px; line-height: 1.6; color: #4b5563; font-size: 15px; font-family: Arial, sans-serif;">${withBrs}</p>`;
  });

  return formattedBlocks.filter(b => b !== "").join("\n");
}

/**
 * Wraps content in a premium BloFin-style email template.
 */
export function generateBloFinStyleEmailHtml(title: string, contentHtml: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hello,";
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
                <!-- HEADER (BloFin style black bar) -->
                <tr>
                  <td style="background-color: #000000; padding: 24px 30px; border-bottom: 4px solid #f97316;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" valign="middle">
                          <span style="font-family: Arial, sans-serif; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            <span style="color: #f97316;">AR</span> Exchange
                          </span>
                        </td>
                        <td align="right" valign="middle" style="width: 50px;">
                          <!-- Orange/Green diagonal blocks -->
                          <table border="0" cellpadding="0" cellspacing="0" style="display: inline-block;">
                            <tr>
                              <td style="width: 12px; height: 26px; background-color: #f97316;"></td>
                              <td style="width: 4px;"></td>
                              <td style="width: 12px; height: 26px; background-color: #22c55e;"></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CONTENT AREA -->
                <tr>
                  <td style="padding: 40px 30px; background-color: #ffffff;">
                    <!-- Greeting -->
                    <p style="margin: 0 0 20px; font-size: 16px; font-weight: bold; color: #111827; font-family: Arial, sans-serif;">
                      ${greeting}
                    </p>
                    
                    <!-- Main Body -->
                    <div style="font-size: 15px; line-height: 1.6; color: #374151; font-family: Arial, sans-serif;">
                      ${contentHtml}
                    </div>

                    <!-- Regards -->
                    <p style="margin: 30px 0 0; font-size: 15px; color: #4b5563; line-height: 1.5; font-family: Arial, sans-serif;">
                      Regards,<br>
                      <strong style="color: #111827;">AR Exchange team</strong>
                    </p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #ffffff; padding: 0 30px 40px; border-top: 1px solid #f3f4f6;">
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 30px 0;" />
                    
                    <!-- Disclaimer -->
                    <p style="margin: 0 0 16px; font-size: 11px; line-height: 1.5; color: #9ca3af; text-align: center; font-family: Arial, sans-serif;">
                      AR Exchange strives to safeguard your account and transactions to protect you from scams. Thank you for choosing AR Exchange.
                    </p>

                    <!-- Support Link -->
                    <p style="margin: 0 0 20px; font-size: 12px; text-align: center; font-family: Arial, sans-serif;">
                      <a href="mailto:support@aventridge.com" style="color: #f97316; text-decoration: none; font-weight: bold;">support@aventridge.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Sends a custom email wrapped in the BloFin style template.
 */
export async function sendGeneralEmail(to: string, subject: string, markdownContent: string, name?: string) {
  const contentHtml = parseMarkdownToHtml(markdownContent);
  const html = generateBloFinStyleEmailHtml(subject, contentHtml, name);

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`✅ General email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`❌ SMTP failed to send general email to ${to}:`, error.message);
    throw error;
  }
}

export async function sendOtpEmail(to: string, otp: string, type: 'login' | 'signup' | 'reset' = 'login') {
  console.log(`🚀 Attempting to send ${type} OTP email via SMTP to: ${to}`);

  const subjects = {
    login: "Verify Your Email - AR Exchange",
    signup: "Welcome to AR Exchange - Verify Your Email",
    reset: "Reset Your Password - AR Exchange",
  };

  const titles = {
    login: "Verify Your Email",
    signup: "Welcome to AR Exchange!",
    reset: "Reset Your Password",
  };

  const messages = {
    login: "Welcome back! Please use the verification code below to complete your sign in.",
    signup: "Welcome to AR Exchange! Please use the verification code below to complete your registration.",
    reset: "You've requested to reset your password. Please use the verification code below to proceed.",
  };

  const name = to.split('@')[0];
  
  // Format the OTP section beautifully as parsed HTML inside the white BloFin container
  const contentHtml = `
    <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px; font-family: Arial, sans-serif; line-height: 1.6;">
      ${messages[type]}
    </p>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif;">Verification Code</p>
      <div style="font-size: 38px; font-weight: bold; color: #f97316; letter-spacing: 6px; margin: 10px 0; font-family: Courier, monospace;">
        ${otp}
      </div>
      <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px; font-family: Arial, sans-serif;">The verification code is valid for 10 minutes. Do not share the code with anyone.</p>
    </div>
    <p style="margin: 16px 0 0; font-size: 14px; color: #9ca3af; font-family: Arial, sans-serif;">If you didn't request this code, please ignore this email.</p>
  `;

  const html = generateBloFinStyleEmailHtml(titles[type], contentHtml, name);

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: subjects[type],
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

  const contentHtml = `
    <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px; font-family: Arial, sans-serif; line-height: 1.6;">
      Thank you for joining AR Exchange! You're now part of our community of elite traders.
    </p>
    
    <div style="margin: 20px 0; padding-left: 14px; border-left: 3px solid #f97316;">
      <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px; font-family: Arial, sans-serif;">✓ Advanced trading tools & real-time analytics</p>
      <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px; font-family: Arial, sans-serif;">✓ Access global markets effortlessly</p>
      <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px; font-family: Arial, sans-serif;">✓ Secure platform and funds protection</p>
    </div>

    <div style="margin: 30px 0 20px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aventridge.com"}/dashboard" 
         style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; font-family: Arial, sans-serif;">
        Go to Dashboard
      </a>
    </div>
  `;

  const html = generateBloFinStyleEmailHtml("Welcome to AR Exchange!", contentHtml, name);

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Welcome to AR Exchange! 🎉",
      html,
    });

    console.log(`✅ Welcome email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`❌ Error sending welcome email to ${to}:`, error.message);
    return null;
  }
}

export async function sendKycEmail(to: string, name: string, status: "approved" | "rejected", reason?: string) {
  console.log(`🚀 Sending KYC ${status} email to: ${to}`);

  const isApproved = status === "approved";
  const title = isApproved ? "Identity Verified! 🎉" : "Verification Update";
  const statusColor = isApproved ? "#22c55e" : "#ef4444";
  
  const message = isApproved
    ? "Great news! Your identity verification has been approved. You now have full access to all AR Exchange features, including withdrawals and advanced trading."
    : `Your KYC application was unfortunately rejected. Reason: ${reason || "Please ensure your documents are clear and valid."}`;

  const contentHtml = `
    <div style="margin: 20px 0; padding: 16px; background-color: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isApproved ? '#bbf7d0' : '#fecaca'}; border-radius: 8px; text-align: center;">
      <span style="font-size: 16px; font-weight: bold; color: ${statusColor}; font-family: Arial, sans-serif;">
        KYC STATUS: ${status.toUpperCase()}
      </span>
    </div>

    <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px; font-family: Arial, sans-serif; line-height: 1.6;">
      ${message}
    </p>
    
    <div style="margin: 30px 0 20px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aventridge.com"}/verify-identity" 
         style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; font-family: Arial, sans-serif;">
        View Verification Status
      </a>
    </div>
  `;

  const html = generateBloFinStyleEmailHtml(title, contentHtml, name);

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `${title} - AR Exchange`,
      html,
    });

    console.log(`✅ KYC email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`❌ Error sending KYC email to ${to}:`, error.message);
    return null;
  }
}
