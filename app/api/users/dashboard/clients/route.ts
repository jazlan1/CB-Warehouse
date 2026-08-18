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