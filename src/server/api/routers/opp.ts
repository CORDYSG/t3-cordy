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

    return enrichedOpps;
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
  searchOpportunities: publicProcedure
    .input(
      z.object({
        search: z.string().optional().default(""),
        type: z.string().optional().default(""),
        zoneIds: z.array(z.string()).optional().default([]),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, type, zoneIds, page, limit } = input;
      const skip = (page - 1) * limit;

      // Define the where clause with proper typing
      const whereClause: Prisma.OppsWhereInput = {};

      // Add search condition
      if (search && search.trim() !== "") {
        whereClause.OR = [
          {
            name: { contains: search, mode: "insensitive" as Prisma.QueryMode },
          },
          {
            caption: {
              contains: search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
          // Add more fields as needed
        ];
      }

      // Add type filter if provided
      if (type && type !== "") {
        whereClause.type = { has: type };
      }

      if (zoneIds && zoneIds.length > 0) {
        if (zoneIds && zoneIds.length > 0) {
          whereClause.zone = {
            hasSome: zoneIds, // matches any zone name in the array
          };
        }
      }

      // Execute search query
      const opps = await ctx.db.opps.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      });

      //fetching zones for enriched opps
      const zones = await db.zones.findMany({});
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

      // Get filtered count for pagination
      const totalOpps = await ctx.db.opps.count({
        where: whereClause,
      });

      return {
        opps: enrichedOpps,
        totalOpps,
      };
    }),
});
