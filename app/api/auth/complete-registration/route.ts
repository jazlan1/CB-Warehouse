import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const invite = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "User already registered" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: invite.email,
      name: invite.name,
      companyName: invite.companyName,
      password: hashed,
      role: invite.role,        // ✅ invite (invitation nahi)
      isActivated: true,
    },
  });

  // ✅ Role ke hisaab se profile
  if (invite.role === "CLIENT") {
    await prisma.clientProfile.create({
      data: {
        userId: user.id,
        name: invite.name ?? "",
        companyName: invite.companyName,
        phone: invite.phone,
        address: invite.address,
        notes: invite.notes,
        image: invite.image,
      },
    });
  } else if (invite.role === "CB") {
    await prisma.cBProfile.create({
      data: {
        userId: user.id,
        name: invite.name ?? "",
        phone: invite.phone,
        image: invite.image,
      },
    });
  }

  // ✅ Invitation delete karo
  await prisma.invitation.delete({
    where: { id: invite.id },
  });

  return NextResponse.json({ success: true });
}