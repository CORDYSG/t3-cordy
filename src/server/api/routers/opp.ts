import { z } from "zod";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";

export const oppRouter = createTRPCRouter({
  getAllOpportunitiesWithZones: publicProcedure.query(async () => {
    const opps = await db.opps.findMany({});
    const zones = await db.zones.findMany({});

    if (opps.length === 0) return [];
    if (zones.length === 0) return opps;

    // Create a quick lookup map for zone names
    const zoneMap = new Map<string, (typeof zones)[number]>();
    for (const zone of zones) {
      if (zone.name) {
        zoneMap.set(zone.name, zone);
      }
    }

    // For each opportunity, map zone names to zone objects
    const enrichedOpps = opps.map((opp) => {
      const oppZones = (opp.zone ?? [])
        .map((zoneName) => zoneMap.get(zoneName))
        .filter(Boolean);
      return {
        ...opp,
        zones: oppZones, // we add a new field 'zones' which has the full zone objects
      };
    });

    return enrichedOpps as OppWithZoneType[];
  }),

  getAllOpportunitiesWithZonesLimit: publicProcedure
    .input(z.object({ limit: z.number(), page: z.number().min(1) })) // Added page parameter
    .query(async ({ input }) => {
      const { limit, page } = input;
      const skip = (page - 1) * limit; // Calculate the number of records to skip

      const [opps, totalOpps] = await Promise.all([
        db.opps.findMany({
          take: limit,
          skip: skip,
        }),
        db.opps.count(), // Get the total number of opportunities
      ]);

      const zones = await db.zones.findMany();

      if (opps.length === 0) return { opps: [], totalOpps };

      if (zones.length === 0) return { opps, totalOpps };

      // Create a quick lookup map for zone names
      const zoneMap = new Map<string, (typeof zones)[number]>();
      for (const zone of zones) {
        if (zone.name) {
          zoneMap.set(zone.name, zone);
        }
      }

      // For each opportunity, map zone names to zone objects
      const enrichedOpps = opps.map((opp) => {
        const oppZones = (opp.zone ?? [])
          .map((zoneName) => zoneMap.get(zoneName))
          .filter(Boolean);
        return {
          ...opp,
          zones: oppZones, // we add a new field 'zones' which has the full zone objects
        };
      });

      return { opps: enrichedOpps, totalOpps };
    }),
});
