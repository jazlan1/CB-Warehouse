import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      totalProducts: inventory.length,
      data: inventory.map((item) => ({
        inventoryId: item.id,
        productName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        bin: item.bin,
        condition: item.condition,

        clientId: item.client?.id || null,
        clientName: item.client?.name || null,
        clientCompany: item.client?.companyName || null,

        createdById: item.createdBy.id,
        createdByName: item.createdBy.name,
        createdByRole: item.createdBy.role,

        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory",
      },
      { status: 500 }
    );
  }
}