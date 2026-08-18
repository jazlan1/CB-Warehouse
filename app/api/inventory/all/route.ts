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

    const { searchParams } = new URL(req.url);
    const targetClientId = searchParams.get("clientId");

    let whereClause: any = { isDeleted: false };

    if (user.role === "CLIENT") {
      // Regular client can ONLY see their assigned inventory
      whereClause.clientId = user.id;
    } else if (user.role === "ADMIN") {
      // Admin can view all inventory or filter by specific client
      if (targetClientId && targetClientId !== "ALL") {
        whereClause.clientId = targetClientId;
      }
    } else if (user.role === "CB") {
      // CB Warehouse team can view all or filtered
      if (targetClientId && targetClientId !== "ALL") {
        whereClause.clientId = targetClientId;
      }
    }

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
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