import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // ❌ token already used or invalid
    if (!user.otp || user.otp !== token) {
      return NextResponse.json(
        { error: "Token already used or invalid" },
        { status: 400 }
      );
    }

    // ❌ expired check
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 400 }
      );
    }

    // 🔐 hash password
    const hashed = await bcrypt.hash(password, 10);

    // ✅ IMPORTANT: token instantly invalidate
    await prisma.user.update({
      where: { email: user.email },
      data: {
        password: hashed,
        otp: null,
        otpExpiry: null, // 👈 one-time use enforce
      },
    });

    return NextResponse.json({
      message: "Password updated successfully (token now invalid)",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}