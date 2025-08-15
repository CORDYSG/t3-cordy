// src/components/ActivityTracker.tsx
"use client";

import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useGuestActivityMerge } from "@/hooks/useGuestActivityMerge";

export function ActivityTracker() {
  useActivityTracker();
  useGuestActivityMerge();

  // This component doesn't render anything, it just runs the hooks
  return null;
}
