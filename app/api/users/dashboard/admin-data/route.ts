import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // STATS
    const totalItems = await prisma.inventory.count({
      where: {
        isDeleted: false,
      },
    });

    const activeShipments = await prisma.order.count({
      where: { status: { in: ["APPROVED", "DISPATCHED"] } },
    });

    const pendingRequests = await prisma.order.count({
      where: { status: "PENDING" },
    });

    const totalOrders = await prisma.order.count();
    const monthlyRevenue = totalOrders * 170;

    // SHIPMENTS
    const shipmentsRaw = await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED", "DISPATCHED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: {
          select: { name: true, companyName: true },
        },
        items: true,
      },
    });

    const seenOrders = new Set();

    const shipments = shipmentsRaw
      .filter((o) => {
        if (seenOrders.has(o.id)) return false;
        seenOrders.add(o.id);
        return true;
      })
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber ?? order.id,
        client:
          order.client?.name ||
          order.client?.companyName ||
          "Unknown Client",
        event: order.eventName ?? "N/A",
        shipDate: order.eventDate ?? null,
        itemsCount: order.items.reduce(
          (acc, item) => acc + (item.quantity ?? 0),
          0
        ),
        status: order.status,
      }));

    // ACTIVITIES
    const movementsRaw = await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        inventory: {
          select: { sku: true, name: true },
        },
      },
    });

    const seenMovements = new Set();

    const activities = movementsRaw
      .filter((m) => {
        if (seenMovements.has(m.id)) return false;
        seenMovements.add(m.id);
        return true;
      })
      .map((move) => {
        let type: "pull" | "return" | "intake" = "pull";
        let text = "Stock Updated";

        if (move.type === "OUTGOING") {
          type = "pull";
          text = `Pulled ${move.quantity} items`;
        } else if (move.type === "RETURN") {
          type = "return";
          text = `Return processed (${move.inventory?.sku ?? "N/A"})`;
        } else if (move.type === "ADJUSTMENT") {
          type = "intake";
          text = `Intake logged: ${move.quantity}`;
        }

        return {
          id: move.id,
          type,
          text,
          subText: `SKU: ${move.inventory?.sku ?? "N/A"} | ${
            move.inventory?.name ?? ""
          }`,
          date: move.createdAt,
        };
      });

    // INVENTORY
    const inventoryRaw = await prisma.inventory.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const seenSku = new Set();

    const inventory = inventoryRaw
      .filter((i) => {
        if (seenSku.has(i.sku)) return false;
        seenSku.add(i.sku);
        return true;
      })
      .map((item) => ({
        sku: item.sku,
        name: item.name,
        qty: item.quantity ?? 0,
        bin: item.bin ?? "N/A",
        location: "W Dallas St",
        updatedAt: item.createdAt,
      }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalItems,
          activeShipments,
          pendingRequests,
          monthlyRevenue: `$${monthlyRevenue.toLocaleString()}`,
        },
        shipments,
        activities,
        inventory,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Server Error",
      },
      {
        status: err.message?.includes("Unauthorized") ? 401 : 500,
      }
    );
  }
}