import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

function verifyTelegramAuth(data: Record<string, any>) {
  const { hash, ...rest } = data;

  const sorted = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secret).update(sorted).digest("hex");

  return hmac === hash;
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  const isValid = verifyTelegramAuth(data);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid Telegram signature" }, { status: 401 });
  }

  // Now trigger sign-in via Credentials provider
  const res = NextResponse.redirect(new URL("/api/auth/callback/credentials", req.url));
  res.cookies.set("telegram_user", JSON.stringify({
    telegramId: data.id,
    username: data.username,
  }), { httpOnly: true, path: "/" });

  return res;
}
