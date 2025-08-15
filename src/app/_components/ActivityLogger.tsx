// src/components/ActivityLogger.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/react";

interface ActivityLoggerProps {
  activityType: "page_view" | "click" | "interaction";
  metadata?: Record<string, any>;
}

export function ActivityLogger({
  activityType,
  metadata,
}: ActivityLoggerProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const logActivity = api.activity.logActivity.useMutation();

  useEffect(() => {
    if (status === "loading") return;

    const guestId = !session?.user
      ? localStorage.getItem("guestId")
      : undefined;

    if (session?.user || guestId) {
      logActivity.mutate({
        guestId: guestId || undefined,
        activityType,
        url: pathname,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          authenticated: !!session?.user,
        },
      });
    }
  }, [activityType, metadata, pathname, session, status, logActivity]);

  return null;
}
