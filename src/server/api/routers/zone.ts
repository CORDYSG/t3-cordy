import { z } from "zod";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const zoneRouter = createTRPCRouter({
  getAllZones: publicProcedure.query(async () => {
    const zones = await db.zones.findMany({});

    if (zones.length === 0) return [];
    return zones;
  }),

  getZonesForOptions : publicProcedure
    .query( async()  => {
    const zones = await db.zones.findMany({
      select: {
        name: true,
        airtable_id: true,
      },
    });

      if (zones.length === 0) return [];
      return zones.map((zone) => ({
        value: zone.airtable_id,
        label: zone.name,
      }));
    })
  })
