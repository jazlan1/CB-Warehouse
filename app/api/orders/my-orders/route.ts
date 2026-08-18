import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    const { searchParams } = new URL(req.url);
    const targetClientId = searchParams.get("clientId");

    let whereQuery: any = { clientId: user.id };

    if (user.role === "ADMIN") {
      if (targetClientId && targetClientId !== "ALL") {
        whereQuery = { clientId: targetClientId };
      } else if (!targetClientId) {
        whereQuery = { clientId: user.id };
      } else {
        whereQuery = {};
      }
    }

    const orders = await prisma.order.findMany({
      where: whereQuery,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}