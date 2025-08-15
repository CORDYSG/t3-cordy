// src/contexts/GuestContext.tsx
"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useGuestId } from "@/lib/guest-session";

interface GuestHistory {
  seenOppIds: string[];
  likedOppIds: string[];
}

interface GuestContextType {
  guestId: string | null;
  guestHistory: GuestHistory;
  updateGuestHistory: (type: "seen" | "liked", oppId: string) => void;
  addSeenOpportunity: (oppId: string) => void;
  addLikedOpportunity: (oppId: string) => void;
  isOpportunitySeen: (oppId: string) => boolean;
  isOpportunityLiked: (oppId: string) => boolean;
  removeSeenOpportunity: (oppId: string) => void;
  removeLikedOpportunity: (oppId: string) => void;
  clearGuestHistory: () => void;
  isGuest: boolean;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: ReactNode }) {
  const guestData = useGuestId(); // This runs ONCE at the app level

  return (
    <GuestContext.Provider value={guestData}>{children}</GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error("useGuest must be used within a GuestProvider");
  }
  return context;
}
