import { z } from "zod";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const zoneRouter = createTRPCRouter({
  getAllZones: publicProcedure.query(async () => {
    const zones = await db.zones.findMany({});

    if (zones.length === 0) return [];
    return zones;
  }),
});
