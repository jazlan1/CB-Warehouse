import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { getJwtSecretKey } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // OTP check
    if (!user.otp || user.otp !== otp.toString()) {
      return NextResponse.json(
        { error: "Invalid OTP." },
        { status: 400 }
      );
    }

    // Expiry check
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: "OTP expired." },
        { status: 400 }
      );
    }

    // Clear OTP
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        otp: null,
        otpExpiry: null,
      },
    });

    // JWT GENERATE
    const secret = getJwtSecretKey();
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const redirectPath =
      user.role === "ADMIN"
        ? "/dashboard/admin"
        : user.role === "CB"
        ? "/dashboard/team"
        : "/dashboard/client";

    const res = NextResponse.json({
      message: "Login successful",
      redirect: redirectPath,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });

    res.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("VERIFY_OTP_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}