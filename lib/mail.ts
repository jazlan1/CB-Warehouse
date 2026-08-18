import nodemailer from "nodemailer";

/**
 * Creates and returns a Nodemailer transporter.
 * Supports standard Hostinger / custom SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * with backward-compatible fallback to Gmail service (EMAIL_USER, EMAIL_PASS).
 */
export function getMailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 465,
      secure: smtpSecure,
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

  // Fallback for development if no credentials are configured
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
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    "noreply@warehouse-portal.com"
  );
}

/**
 * Send Login OTP Email
 */
export async function sendLoginOtpEmail(email: string, otp: string) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log(`[DEV OTP LOG] Email: ${email}, OTP: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: getFromEmail(),
    to: email,
    subject: "Your Login OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Warehouse Portal Login</h2>
        <p style="color: #475569; font-size: 15px;">Your one-time verification code is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #2563eb;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">This code is valid for <b>5 minutes</b>. If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send Admin Login OTP Email
 */
export async function sendAdminLoginOtpEmail(email: string, otp: string) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log(`[DEV ADMIN OTP LOG] Email: ${email}, OTP: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: getFromEmail(),
    to: email,
    subject: "Admin Access OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Admin Portal Verification</h2>
        <p style="color: #475569; font-size: 15px;">Your Admin verification OTP is:</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0284c7;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">This administrative code expires in <b>5 minutes</b>.</p>
      </div>
    `,
  });
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log(`[DEV RESET LOG] Email: ${email}, Link: ${resetLink}`);
    return;
  }

  await transporter.sendMail({
    from: getFromEmail(),
    to: email,
    subject: "Reset Your Password - Warehouse Portal",
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
}

/**
 * Send Registration / Invitation Email
 */
export async function sendInvitationEmail(email: string, name: string, inviteLink: string) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log(`[DEV INVITE LOG] Email: ${email}, Name: ${name}, Link: ${inviteLink}`);
    return;
  }

  await transporter.sendMail({
    from: getFromEmail(),
    to: email,
    subject: "Complete Your Warehouse Portal Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Welcome to the Warehouse Portal, ${name}!</h2>
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
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log(`[DEV ORDER STATUS LOG] Email: ${clientEmail}, Order #${orderNumber}, Status: ${newStatus}`);
    return;
  }

  const getStatusColor = (s: string) => {
    const lower = s.toLowerCase();
    if (lower.includes("deliver") || lower.includes("success") || lower.includes("confirm")) return "#10B981";
    if (lower.includes("pend") || lower.includes("process")) return "#F59E0B";
    if (lower.includes("cancel") || lower.includes("fail")) return "#EF4444";
    return "#6B7280";
  };

  await transporter.sendMail({
    from: getFromEmail(),
    to: clientEmail,
    subject: `Order #${orderNumber} Status Updated`,
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
                      The status of your order <strong>#${orderNumber}</strong> has been updated.
                    </p>
                    <table width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; border-collapse: separate; padding: 18px; margin-bottom: 25px;">
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 14px; color: #64748B;" width="40%"><strong>Order Number:</strong></td>
                        <td style="padding-bottom: 10px; font-size: 14px; color: #0F172A; font-weight: 600;">#${orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 14px; color: #64748B;"><strong>Event Name:</strong></td>
                        <td style="padding-bottom: 10px; font-size: 14px; color: #0F172A;">${eventName}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 14px; color: #64748B;"><strong>Previous Status:</strong></td>
                        <td style="padding-bottom: 10px; font-size: 14px; color: #EF4444;"><strike>${oldStatus}</strike></td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #64748B;"><strong>New Status:</strong></td>
                        <td>
                          <span style="background-color: ${getStatusColor(newStatus)}; color: #ffffff; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; display: inline-block;">
                            ${newStatus}
                          </span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0; font-size: 14px; color: #475569;">Thank you for your business!</p>
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
}
