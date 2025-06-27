import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

