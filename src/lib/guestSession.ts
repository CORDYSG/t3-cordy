// utils/guestSession.ts
export const getOrCreateGuestId = () => {
  let guestId = sessionStorage.getItem("guestId");
  if (!guestId) {
    guestId = crypto.randomUUID(); // or nanoid
    sessionStorage.setItem("guestId", guestId);
  }
  return guestId;
};

export const saveGuestInteraction = (
  oppId: string,
  interaction: Partial<InteractionType>,
) => {
  const key = `guest-opp-${oppId}`;
  const existing: Record<string, unknown> = JSON.parse(sessionStorage.getItem(key) ?? "{}") as Record<string, unknown>;
  const updated = { ...existing, ...interaction };
  sessionStorage.setItem(key, JSON.stringify(updated));
};

export const getGuestInteractions = () => {
  return Object.entries(sessionStorage)
    .filter(([key]) => key.startsWith("guest-opp-"))
    .map(([key, val]) => {
      const parsedValue: Record<string, unknown> = JSON.parse(val as string);
      return {
        oppId: key.replace("guest-opp-", ""),
        ...parsedValue,
      };
    });
};
