import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!["ADMIN", "CB"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("email") || searchParams.get("query") || "").trim();

    let whereQuery: any = {
      isActivated: true,
      role: { in: ["CLIENT", "CB"] },
    };

    if (query.length > 0) {
      whereQuery.OR = [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { companyName: { contains: query, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereQuery,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
      },
      take: 25,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}