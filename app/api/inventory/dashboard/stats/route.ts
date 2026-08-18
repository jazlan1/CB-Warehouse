import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    const inventoryWhere: any = {
      isDeleted: false,
    };

    if (user.role === "CLIENT" || user.role === "CB") {
      inventoryWhere.createdById = user.id;
    }

    const pendingOrdersWhere: any = {
      status: "PENDING",
      items: {
        some: {
          inventory: {
            createdById: user.id,
          },
        },
      },
    };

    if (user.role === "ADMIN") {
      delete pendingOrdersWhere.items;
    }

    const [totalItems, pendingOrders, activeReturns, issues] =
      await Promise.all([
        prisma.inventory.count({
          where: inventoryWhere,
        }),

        prisma.order.count({
          where: pendingOrdersWhere,
        }),

        prisma.return.count({
          where: {
            clientId: user.id,
            status: { in: ["PENDING", "RECEIVED"] },
          },
        }),

        prisma.inventory.count({
          where: {
            ...inventoryWhere,
            OR: [
              { stockStatus: "OUT_OF_STOCK" },
              { stockStatus: "DISCONTINUED" },
            ],
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        totalItems: totalItems ?? 0,
        pendingOrders: pendingOrders ?? 0,
        activeReturns: activeReturns ?? 0,
        issues: issues ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Server Error",
      },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}