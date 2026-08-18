import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "";

  const users = await prisma.user.findMany({
    where: {
      email: { contains: email, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
    },
    take: 5,
  });

  return Response.json({ success: true, data: users });
}