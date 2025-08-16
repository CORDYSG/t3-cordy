import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db"; // adjust based on your Prisma setup

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id)
    return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  const opp = await db.opps.findFirst({
    where: { airtable_id: id },
    select: {
      name: true,
      organisation: true,
      thumbnail_url: true,
    },
  });

  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(opp);
}
