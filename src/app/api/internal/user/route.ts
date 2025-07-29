
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db"; // adjust based on your Prisma setup

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}