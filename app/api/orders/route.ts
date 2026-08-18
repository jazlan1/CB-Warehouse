import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            inventory: {
              OR: [
                { createdById: user.id },
                { clientId: user.id },
              ],
            },
          },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
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
      cartItems 
    } = body;

    if (!eventName || !eventDate || !shipToAddress || !returnAddress || !cartItems || Object.keys(cartItems).length === 0) {
      return NextResponse.json(
        { success: false, message: "Missing required fields or cart is empty." },
        { status: 400 }
      );
    }

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        eventName,
        eventDate: new Date(eventDate), 
        shipToAddress,
        returnAddress,
        specialInstructions: specialInstructions || null,
        clientId: user.id, 
        items: {
          create: Object.entries(cartItems).map(([inventoryId, qty]) => ({
            inventoryId: inventoryId,
            quantity: Number(qty),
          })),
        },
      },
      include: {
        items: true, 
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Order dynamic request created successfully.", 
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