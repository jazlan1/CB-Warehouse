import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromToken(req);

    const cartItems = await prisma.cartItem.findMany({
      where: { 
        userId: userId,
        inventory: {
          isDeleted: false,
          stockStatus: "IN_STOCK",
        }
      },
      include: {
        inventory: true, 
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: cartItems });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromToken(req);
    const body = await req.json();
    const { inventoryId, quantity = 1 } = body;

    if (!inventoryId) {
      return NextResponse.json({ success: false, message: "Inventory ID is required" }, { status: 400 });
    }

    const targetInventory = await prisma.inventory.findUnique({
      where: { id: inventoryId }
    });

    if (!targetInventory) {
      return NextResponse.json({ success: false, message: "Inventory item not found" }, { status: 404 });
    }

    if (targetInventory.stockStatus !== "IN_STOCK") {
      return NextResponse.json(
        { 
          success: false, 
          message: targetInventory.stockStatus === "DISCONTINUED" 
            ? "This item has been discontinued and cannot be requested." 
            : "This item is currently out of stock and cannot be added to your request." 
        },
        { status: 400 }
      );
    }

    if (targetInventory.isDeleted) {
      return NextResponse.json(
        { success: false, message: "This item is no longer available." },
        { status: 404 }
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_inventoryId: {
          userId,
          inventoryId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId,
        inventoryId,
        quantity,
      },
      include: {
        inventory: true,
      }
    });

    return NextResponse.json({ success: true, data: cartItem });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromToken(req);
    const body = await req.json();
    const { cartItemId, action } = body;

    if (!cartItemId || !action) {
      return NextResponse.json({ success: false, message: "Missing required properties" }, { status: 400 });
    }

    const currentItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId }
    });

    if (!currentItem || currentItem.userId !== userId) {
      return NextResponse.json({ success: false, message: "Cart component access denied" }, { status: 403 });
    }

    let targetQty = currentItem.quantity;
    if (action === "increment") targetQty += 1;
    if (action === "decrement") targetQty -= 1;

    if (targetQty <= 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId }
      });
      return NextResponse.json({ success: true, message: "Item completely dropped from collection matrix." });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: targetQty },
      include: { inventory: true }
    });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserIdFromToken(req);
    const body = await req.json();
    const { cartItemId } = body;

    if (!cartItemId) {
      return NextResponse.json({ success: false, message: "Cart Item ID missing parameter token." }, { status: 400 });
    }

    const targetRow = await prisma.cartItem.findUnique({
      where: { id: cartItemId }
    });

    if (!targetRow || targetRow.userId !== userId) {
      return NextResponse.json({ success: false, message: "Action unauthorized on verified item matrix index." }, { status: 403 });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    return NextResponse.json({ success: true, message: "Item purged from cart cluster database." });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}