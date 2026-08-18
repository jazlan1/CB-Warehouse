import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    const where =
      user.role === "CLIENT"
        ? { clientId: user.id }
        : {}; // CB + ADMIN see all

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          },
        },
        items: {
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
                sku: true,
                bin: true,
                quantity: true,
                condition: true,
                stockStatus: true,
                images: true,
              },
            },
          },
        },
        returns: {
          select: {
            id: true,
            status: true,
            receivedAt: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Error" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}