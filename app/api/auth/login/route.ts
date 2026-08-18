import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendLoginOtpEmail } from "@/lib/mail";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin must use admin login." },
        { status: 403 }
      );
    }

    if (user.role === "CB") {
      return NextResponse.json(
        { error: "CB Team must use CB warehouse login." },
        { status: 403 }
      );
    }

    if (!user.isActivated) {
      return NextResponse.json(
        { error: "Account not activated." },
        { status: 403 }
      );
    }

    // 🔐 OTP GENERATION
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await prisma.user.update({
      where: { email: user.email },
      data: {
        otp,
        otpExpiry,
      },
    });

    console.log(`\n🔑 [LOGIN OTP] User: ${user.email} | OTP Code: ${otp}\n`);

    // 📩 EMAIL SEND VIA CENTRALIZED MAILER
    await sendLoginOtpEmail(user.email, otp);

    return NextResponse.json({
      message: "OTP sent to your email",
      email: user.email,
      ...(process.env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
    });
  } catch (error: any) {
    console.error("LOGIN_ROUTE_ERROR:", error);

    const isDbError =
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("connect") ||
      error.code === "P1001" ||
      error.code === "ECONNREFUSED";

    const errorMessage =
      isDbError && process.env.NODE_ENV !== "production"
        ? "Database connection failed (ECONNREFUSED). Please check your DATABASE_URL in .env and make sure PostgreSQL is running."
        : error.message || "Internal Server Error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}