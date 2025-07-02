import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto";

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRandomAccentBg(): string {
  const accentColors = [
"bg-accent-blue",
"bg-accent-yellow",
"bg-accent-pink",
"bg-accent-green",
"bg-accent-magenta",
"bg-accent-orange"
  ];
  const randomIndex = Math.floor(Math.random() * accentColors.length);
  return accentColors[randomIndex] ?? "bg-accent-magenta";
}

export function verifyTelegramLogin(
  data: TelegramAuthData,
  botToken: string
): boolean {
  const { hash, ...rest } = data;

  const sorted = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(sorted).digest("hex");

  return hmac === hash;
}