import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["CB", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const bin = formData.get("bin") as string;
    const description = formData.get("description") as string;
    const condition = formData.get("condition") as string;
    const quantity = Number(formData.get("quantity")) || 0;
    const clientId = formData.get("clientId") as string;

    const imagesFiles = formData.getAll("images") as File[];

    // Upload files to persistent storage (Cloudinary or local persistent disk)
    const imageUrls: string[] = [];

    for (const file of imagesFiles) {
      if (file.size > 0) {
        try {
          const uploadedUrl = await uploadFile(file, "inventory-items");
          imageUrls.push(uploadedUrl);
        } catch (uploadError) {
          console.error(`❌ Upload failed for ${file.name}:`, uploadError);
          throw new Error(`Failed to upload image: ${file.name}`);
        }
      }
    }

    const inventory = await prisma.inventory.create({
      data: {
        name,
        sku,
        bin,
        quantity,
        description,
        condition,
        images: imageUrls,
        createdById: user.id,
        clientId: clientId || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: inventory,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ INVENTORY INTAKE POST ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Server Error",
      },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    const inventoryItems = await prisma.inventory.findMany({
      where: {
        createdById: user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        bin: true,
        quantity: true,
        condition: true,
        description: true,
        images: true,
        stockStatus: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: inventoryItems,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["CB", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ success: false, message: "Item ID is required" }, { status: 400 });
    }

    const existingItem = await prisma.inventory.findFirst({
      where: { id: itemId, createdById: user.id },
    });

    if (!existingItem) {
      return NextResponse.json({ success: false, message: "Inventory item not found or unauthorized" }, { status: 404 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const bin = formData.get("bin") as string;
    const description = formData.get("description") as string;
    const condition = formData.get("condition") as string;
    const quantity = formData.get("quantity") ? Number(formData.get("quantity")) : undefined;

    let finalImages = [...existingItem.images];
    const newImagesFiles = formData.getAll("images") as File[];
    const uploadedUrls: string[] = [];

    for (const file of newImagesFiles) {
      if (file.size > 0) {
        try {
          const uploadedUrl = await uploadFile(file, "inventory-items");
          uploadedUrls.push(uploadedUrl);
        } catch (uploadError) {
          console.error("❌ Update upload failed:", uploadError);
          throw new Error("Failed to upload new images.");
        }
      }
    }

    if (uploadedUrls.length > 0) {
      finalImages = uploadedUrls;
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id: itemId },
      data: {
        name: name || undefined,
        sku: sku || undefined,
        bin: bin || undefined,
        description: description || undefined,
        condition: condition || undefined,
        quantity: quantity,
        images: finalImages,
      },
    });

    return NextResponse.json({ success: true, data: updatedInventory }, { status: 200 });
  } catch (err: any) {
    console.error("❌ PUT INVENTORY ERROR:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "Server Error during update" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["CB", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden: Access Denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ success: false, message: "Item ID is required" }, { status: 400 });
    }

    const existingItem = await prisma.inventory.findFirst({
      where: { id: itemId, createdById: user.id },
    });

    if (!existingItem) {
      return NextResponse.json({ success: false, message: "Item not found or unauthorized" }, { status: 404 });
    }

    await prisma.inventory.update({
      where: { id: itemId },
      data: { isDeleted: true },
    });

    return NextResponse.json(
      { success: true, message: "Inventory item archived and removed from active stock successfully." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ SOFT DELETE INVENTORY ERROR:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "Server Error during archiving" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["CB", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: "Item ID is required" },
        { status: 400 }
      );
    }

    const existingItem = await prisma.inventory.findFirst({
      where: { id: itemId, createdById: user.id, isDeleted: false },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    const newStatus =
      existingItem.stockStatus === "IN_STOCK" ? "OUT_OF_STOCK" : "IN_STOCK";

    const updated = await prisma.inventory.update({
      where: { id: itemId },
      data: {
        stockStatus: newStatus,
        quantity: newStatus === "OUT_OF_STOCK" ? 0 : existingItem.quantity,
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Server Error" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}