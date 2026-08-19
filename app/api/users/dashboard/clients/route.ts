import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const clients = await prisma.user.findMany({
      where: {
        role: {
          in: ["CLIENT", "CB"],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        role: true,
        createdAt: true,
        isActivated: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: "Client ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, companyName, role, isActivated, email } = body;

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        name: name || undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        role: role || undefined,
        isActivated: typeof isActivated === "boolean" ? isActivated : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        role: true,
        isActivated: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Client details updated successfully.",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("❌ CLIENT UPDATE ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: "Client ID is required" },
        { status: 400 }
      );
    }

    // Safety: Detach any linked inventory and preserve them for Admin
    await prisma.inventory.updateMany({
      where: { clientId: targetUserId },
      data: { clientId: null },
    });

    await prisma.inventory.updateMany({
      where: { createdById: targetUserId },
      data: { createdById: user.id },
    });

    // Reassign or safely handle orders
    await prisma.order.updateMany({
      where: { clientId: targetUserId },
      data: { clientId: user.id },
    });

    // Delete child profiles
    await prisma.cartItem.deleteMany({ where: { userId: targetUserId } });
    await prisma.clientProfile.deleteMany({ where: { userId: targetUserId } });
    await prisma.cBProfile.deleteMany({ where: { userId: targetUserId } });

    // Delete user
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return NextResponse.json({
      success: true,
      message: "Client account removed successfully. All assigned items and orders were preserved.",
    });
  } catch (error: any) {
    console.error("❌ CLIENT DELETE ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}