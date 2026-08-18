import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sendOrderStatusEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["ADMIN", "CB"].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only Admin and CB Team can update shipment status." },
        { status: 403 }
      );
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing id or status",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    const oldStatus = order.status;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        items: {
          include: {
            inventory: true,
          },
        },
      },
    });

    // Send Email if status changed
    if (oldStatus !== status && order.client?.email) {
      try {
        await sendOrderStatusEmail(
          order.client.email,
          order.client.name || "Customer",
          order.orderNumber,
          order.eventName,
          oldStatus,
          status
        );
      } catch (mailError) {
        console.error("⚠️ Failed to send order status email notification:", mailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status} successfully.`,
      data: updatedOrder,
    });
  } catch (err: any) {
    console.error("❌ STATUS UPDATE ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        message: err.message || "Internal Server Error",
      },
      {
        status: err.message?.includes("Unauthorized") ? 401 : 500,
      }
    );
  }
}