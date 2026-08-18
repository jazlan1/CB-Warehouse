import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendAdminLoginOtpEmail } from "@/lib/mail";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🚨 ADMIN OR CB
    if (user.role !== "ADMIN" && user.role !== "CB") {
      return NextResponse.json(
        { error: "Access denied. Admin or CB only." },
        { status: 403 }
      );
    }

    // 🔐 OTP GENERATE
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { email: user.email },
      data: {
        otp,
        otpExpiry,
      },
    });

    console.log(`\n🔑 [ADMIN / CB LOGIN OTP] User: ${user.email} | Role: ${user.role} | OTP Code: ${otp}\n`);

    // 📩 EMAIL SEND VIA CENTRALIZED MAILER
    await sendAdminLoginOtpEmail(user.email, otp);

    return NextResponse.json({
      message: "OTP sent to admin email",
      email: user.email,
      ...(process.env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
    });
  } catch (error: any) {
    console.error("ADMIN_LOGIN_ROUTE_ERROR:", error);

    const isDbError =
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("connect") ||
      error.code === "P1001" ||
      error.code === "ECONNREFUSED";

    const errorMessage =
      isDbError && process.env.NODE_ENV !== "production"
        ? "Database connection failed (ECONNREFUSED). Please check your DATABASE_URL in .env and make sure PostgreSQL is running."
        : error.message || "Server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}