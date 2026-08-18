import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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