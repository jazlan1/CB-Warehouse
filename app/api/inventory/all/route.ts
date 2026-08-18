import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["CLIENT", "CB", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    let whereClause: any = { isDeleted: false };

    if (user.role === "CLIENT") {
      whereClause.clientId = user.id;
    } else if (["CB", "ADMIN"].includes(user.role)) {
      whereClause.createdById = user.id;
    }

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: inventory.length,
      data: inventory,
    }, { status: 200 });

  } catch (err: any) {
    console.error("❌ INVENTORY GET ERROR:", err.message);

    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}