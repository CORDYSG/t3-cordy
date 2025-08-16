import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db"; // adjust based on your Prisma setup

export async function GET(req: NextRequest) {
  const comName = req.nextUrl.searchParams.get("comName");

  if (!comName) {
    return NextResponse.json({ error: "No comName provided" }, { status: 400 });
  }

  const opp = await db.community.findFirst({
    where: {
      abbreviation: {
        equals: comName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (!opp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Convert BigInt to string if necessary
  const response = {
    id: opp.id.toString(), // Convert BigInt to string
  };

  return NextResponse.json(response);
}
