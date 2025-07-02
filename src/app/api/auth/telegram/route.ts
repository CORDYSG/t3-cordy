/* eslint-disable */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function verifyTelegramAuth(data: Record<string, any>) {
  const { hash, ...rest } = data;

  const sorted = Object.keys(rest)
    .sort()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secret).update(sorted).digest("hex");

  return hmac === hash;
}

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const isValid = verifyTelegramAuth(data);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid Telegram signature" }, { status: 401 });
  }

  const res = NextResponse.redirect(new URL("/api/auth/callback/credentials", req.url));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const telegramId = data.id;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const username = data.username;

  res.cookies.set(
    "telegram_user",
    JSON.stringify({ telegramId, username }),
    {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }
  );

  return res;
}
