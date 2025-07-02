import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto";


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
  data: Record<string, any>,
  botToken: string
): boolean {
  const { hash, ...rest } = data;

  const sorted = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(sorted).digest("hex");

  return hmac === hash;
}
