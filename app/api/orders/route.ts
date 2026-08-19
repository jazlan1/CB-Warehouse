import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    const { searchParams } = new URL(req.url);
    const targetClientId = searchParams.get("clientId");
    const statusFilter = searchParams.get("status");

    let whereClause: any = {};

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (user.role === "CLIENT") {
      // Clients can only see their own orders
      whereClause.clientId = user.id;
    } else if (user.role === "ADMIN") {
      // Admin can see ALL orders or filter by specific client
      if (targetClientId && targetClientId !== "ALL") {
        whereClause.clientId = targetClientId;
      }
    } else if (user.role === "CB") {
      // CB Warehouse team can see all orders or filter
      if (targetClientId && targetClientId !== "ALL") {
        whereClause.clientId = targetClientId;
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clientProfile: {
              select: {
                companyName: true,
                phone: true,
              },
            },
          },
        },
        items: {
          include: {
            inventory: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);

    const body = await req.json();
    const { 
      orderNumber,
      eventName, 
      eventDate, 
      shipToAddress, 
      returnAddress, 
      specialInstructions, 
      cartItems,
      clientId: requestedClientId
    } = body;

    if (!eventName || !eventDate || !shipToAddress || !returnAddress || !cartItems || Object.keys(cartItems).length === 0) {
      return NextResponse.json(
        { success: false, message: "Missing required fields or cart is empty." },
        { status: 400 }
      );
    }

    // If Admin/CB creates order on behalf of another client, use requestedClientId; otherwise use user.id
    let assignedClientId = user.id;
    if (["ADMIN", "CB"].includes(user.role) && requestedClientId) {
      assignedClientId = requestedClientId;
    }

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: orderNumber ? Number(orderNumber) : undefined,
        eventName,
        eventDate: new Date(eventDate), 
        shipToAddress,
        returnAddress,
        specialInstructions: specialInstructions || null,
        clientId: assignedClientId, 
        items: {
          create: Object.entries(cartItems).map(([inventoryId, qty]) => ({
            inventoryId: inventoryId,
            quantity: Number(qty),
          })),
        },
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

    return NextResponse.json(
      { 
        success: true, 
        message: "Order request created successfully.", 
        data: newOrder 
      },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("❌ ORDER CREATION ERROR:", err.message);

    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["ADMIN", "CB"].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin or Staff role required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { eventName, eventDate, shipToAddress, returnAddress, specialInstructions, status } = body;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        eventName: eventName || undefined,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        shipToAddress: shipToAddress || undefined,
        returnAddress: returnAddress || undefined,
        specialInstructions: specialInstructions !== undefined ? specialInstructions : undefined,
        status: status || undefined,
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

    return NextResponse.json({
      success: true,
      message: "Order updated successfully.",
      data: updatedOrder,
    });
  } catch (err: any) {
    console.error("❌ ORDER UPDATE ERROR:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only Admin can delete orders" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Safely delete order items first, then delete order
    await prisma.orderItem.deleteMany({
      where: { orderId: orderId },
    });

    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully.",
    });
  } catch (err: any) {
    console.error("❌ ORDER DELETE ERROR:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}