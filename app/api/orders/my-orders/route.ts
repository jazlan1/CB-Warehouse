import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromToken(req);

    const orders = await prisma.order.findMany({
      where: { clientId: userId },
      include: {
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