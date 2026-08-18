import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Validation
    if (!email || email.trim() === "") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Security: always respond consistently
    if (!user) {
      return NextResponse.json({ message: "If user exists, email sent" });
    }

    // Token generate
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Store token in DB
    await prisma.user.update({
      where: { email: user.email },
      data: {
        otp: token,
        otpExpiry: expiry,
      },
    });

    // Base URL resolution
    const url = new URL(req.url);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      url.origin;

    const resetLink = `${appUrl.replace(/\/$/, "")}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send reset email via centralized mailer
    await sendPasswordResetEmail(user.email, resetLink);

    return NextResponse.json({ message: "Reset email sent" });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}