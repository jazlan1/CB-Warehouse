import nodemailer from "nodemailer";

/**
 * Creates and returns a Nodemailer transporter.
 * Supports standard Hostinger / custom SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * with backward-compatible fallback to Gmail service (EMAIL_USER, EMAIL_PASS).
 */
export function getMailTransporter() {
  const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const smtpUser = process.env.SMTP_USER || "noreply@codeblkwarehouse.com";
  const smtpPass = process.env.SMTP_PASS || "Codeblkwarehouse@123";
  const smtpSecure = process.env.SMTP_SECURE !== "false" && (smtpPort === 465 || process.env.SMTP_SECURE === "true");

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Fallback to Gmail service if configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  console.warn("⚠️ [Mailer] No SMTP credentials configured. Emails will not be sent.");
  return null;
}

/**
 * Get the configured "from" address
 */
export function getFromEmail(): string {
  return (
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    '"CodeBLK Warehouse" <noreply@codeblkwarehouse.com>'
  );
}

export function getReplyToEmail(): string {
  return '"CodeBLK Warehouse Support" <noreply@codeblkwarehouse.com>';
}

/**
 * Send Login OTP Email
 */
export async function sendLoginOtpEmail(email: string, otp: string) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[DEV OTP LOG] Email: ${email}, OTP: ${otp}`);
      return;
    }

    const plainText = `CodeBLK Warehouse - Login Verification Code\n\nYour one-time verification OTP is: ${otp}\n\nThis code will expire in 5 minutes.\nIf you did not request this OTP, please ignore this email.\n\n--\nCodeBLK Warehouse Logistics & Inventory Management`;

    await transporter.sendMail({
      from: getFromEmail(),
      replyTo: getReplyToEmail(),
      sender: "noreply@codeblkwarehouse.com",
      to: email,
      subject: `Your CodeBLK Warehouse Login Code: ${otp}`,
      text: plainText,
      headers: {
        "X-Mailer": "CodeBLK Warehouse Security System",
        "X-Auto-Response-Suppress": "All",
        "Auto-Submitted": "auto-generated",
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CodeBLK Warehouse Verification</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <tr>
              <td style="padding: 32px 28px; text-align: center; background-color: #0f172a;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">CodeBLK Warehouse</h1>
                <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Logistics &amp; Inventory Management Portal</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 28px;">
                <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hello,</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  You recently requested a one-time verification code to access your CodeBLK Warehouse account.
                </p>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px;">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                    </td>
                  </tr>
                </table>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 24px 0;">
                  ⏱️ This code is valid for <b>5 minutes</b> and can only be used once.
                </p>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                    If you did not request this login code, please ignore this email or contact support at <a href="mailto:noreply@codeblkwarehouse.com" style="color: #2563eb; text-decoration: none;">noreply@codeblkwarehouse.com</a>.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                  © 2026 CodeBLK Warehouse Portal. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("❌ Failed to send login OTP email:", error);
  }
}

/**
 * Send Admin Login OTP Email
 */
export async function sendAdminLoginOtpEmail(email: string, otp: string) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[DEV ADMIN OTP LOG] Email: ${email}, OTP: ${otp}`);
      return;
    }

    const plainText = `CodeBLK Warehouse - Administrative Verification Code\n\nYour Admin access OTP is: ${otp}\n\nThis code expires in 5 minutes.\n--\nCodeBLK Warehouse Security`;

    await transporter.sendMail({
      from: getFromEmail(),
      replyTo: getReplyToEmail(),
      sender: "noreply@codeblkwarehouse.com",
      to: email,
      subject: `Admin Verification Code: ${otp} - CodeBLK Warehouse`,
      text: plainText,
      headers: {
        "X-Mailer": "CodeBLK Warehouse Security System",
        "X-Auto-Response-Suppress": "All",
        "Auto-Submitted": "auto-generated",
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Administrative Access Code</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
            <tr>
              <td style="padding: 32px 28px; text-align: center; background-color: #1e293b;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">CodeBLK Warehouse</h1>
                <div style="margin-top: 8px;">
                  <span style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                    Administrative Access
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 28px;">
                <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Administrator,</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  Use the following one-time code to authenticate your administrative session:
                </p>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 10px;">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e40af; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                    </td>
                  </tr>
                </table>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 24px 0;">
                  ⏱️ Valid for <b>5 minutes</b>.
                </p>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                    Sent securely from <b>noreply@codeblkwarehouse.com</b>.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                  © 2026 CodeBLK Warehouse Security.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("❌ Failed to send admin login OTP email:", error);
  }
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[DEV RESET LOG] Email: ${email}, Link: ${resetLink}`);
      return;
    }

    const plainText = `Password Reset Request - CodeBLK Warehouse\n\nClick the link below to set a new password:\n${resetLink}\n\nThis link will expire in 15 minutes.\n\n--\nCodeBLK Warehouse Support`;

    await transporter.sendMail({
      from: getFromEmail(),
      replyTo: getReplyToEmail(),
      sender: "noreply@codeblkwarehouse.com",
      to: email,
      subject: "Reset Your CodeBLK Warehouse Password",
      text: plainText,
      headers: {
        "X-Mailer": "CodeBLK Warehouse Security System",
        "X-Auto-Response-Suppress": "All",
        "Auto-Submitted": "auto-generated",
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 15px;">We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:</p>
          <p style="color: #3b82f6; font-size: 12px; word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;">This link will expire in <b>15 minutes</b>. If you did not request a reset, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
  }
}

/**
 * Send Registration / Invitation Email
 */
export async function sendInvitationEmail(email: string, name: string, inviteLink: string) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[DEV INVITE LOG] Email: ${email}, Name: ${name}, Link: ${inviteLink}`);
      return;
    }

    const plainText = `Welcome to CodeBLK Warehouse, ${name}!\n\nYou have been invited to join the portal. Please access the link below to complete your registration:\n${inviteLink}\n\nThis link is valid for 24 hours.\n\n--\nCodeBLK Warehouse Team`;

    await transporter.sendMail({
      from: getFromEmail(),
      replyTo: getReplyToEmail(),
      sender: "noreply@codeblkwarehouse.com",
      to: email,
      subject: "Complete Your CodeBLK Warehouse Registration",
      text: plainText,
      headers: {
        "X-Mailer": "CodeBLK Warehouse Security System",
        "X-Auto-Response-Suppress": "All",
        "Auto-Submitted": "auto-generated",
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to CodeBLK Warehouse, ${name}!</h2>
          <p style="color: #475569; font-size: 15px;">You have been invited to join the portal. Please click the button below to complete your profile and set your account password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${inviteLink}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Complete Registration</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">Or access via this link:</p>
          <p style="color: #3b82f6; font-size: 12px; word-break: break-all;"><a href="${inviteLink}">${inviteLink}</a></p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;">This invitation link is valid for <b>24 hours</b>.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ Failed to send invitation email:", error);
  }
}

/**
 * Send Order Status Update Email
 */
export async function sendOrderStatusEmail(
  clientEmail: string,
  clientName: string,
  orderNumber: number | string,
  eventName: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[DEV ORDER STATUS LOG] Email: ${clientEmail}, Order #${orderNumber}, Status: ${newStatus}`);
      return;
    }

    const plainText = `Order #${orderNumber} Status Updated\n\nHello ${clientName || "Customer"},\n\nThe status of your order #${orderNumber} (${eventName}) has been updated to: ${newStatus}.\n\n--\nCodeBLK Warehouse Logistics`;

    await transporter.sendMail({
      from: getFromEmail(),
      replyTo: getReplyToEmail(),
      sender: "noreply@codeblkwarehouse.com",
      to: clientEmail,
      subject: `Order #${orderNumber} Status Updated: ${newStatus}`,
      text: plainText,
      headers: {
        "X-Mailer": "CodeBLK Warehouse Security System",
        "X-Auto-Response-Suppress": "All",
        "Auto-Submitted": "auto-generated",
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border-collapse: collapse;">
                  <tr>
                    <td style="background-color: #4F46E5; padding: 35px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Order Status Updated</h1>
                      <p style="color: #E0E7FF; margin: 8px 0 0 0; font-size: 14px;">Your order sequence has progressed.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px;">
                      <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.5; color: #334155;">
                        Hello <strong>${clientName || "Customer"}</strong>,
                      </p>
                      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #475569;">
                        The status of your order <strong>#${orderNumber}</strong> has been updated to <strong>${newStatus}</strong>.
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #475569;">Thank you for choosing CodeBLK Warehouse!</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("❌ Failed to send order status email:", error);
  }
}
