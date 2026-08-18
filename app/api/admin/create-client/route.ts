import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuid } from "uuid";
import { sendInvitationEmail } from "@/lib/mail";
import { getAuthUser } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (authUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const name = formData.get("name") as string;
    const companyName = formData.get("companyName") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const notes = formData.get("notes") as string;
    const role = formData.get("role") as string;
    const imageFile = formData.get("image") as File;

    // validation
    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and Email required" },
        { status: 400 }
      );
    }

    // check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // check existing invitation
    const existingInvitation = await prisma.invitation.findUnique({
      where: { email },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent" },
        { status: 400 }
      );
    }

    const safeRole = role === "CB" ? "CB" : "CLIENT";

    // Persistent storage upload
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile, "profile");
    }

    // token generate
    const token = uuid();

    // save invitation
    await prisma.invitation.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        role: safeRole,
        name,
        companyName,
        phone,
        address,
        notes,
        image: imageUrl,
      },
    });

    // invite link
    const url = new URL(req.url);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      url.origin;

    const link = `${appUrl.replace(/\/$/, "")}/auth/register/${token}`;

    // send invitation email via centralized mailer
    await sendInvitationEmail(email, name, link);

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (err: any) {
    console.error("CREATE_CLIENT_ERROR:", err);
    return NextResponse.json(
      {
        error: err.message || "Server error",
      },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}