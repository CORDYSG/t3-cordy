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
  getOppById: publicProcedure
    .input(z.object({ oppId: z.string() }))
    .query(async ({ input }) => {
      const opp = await db.opps.findFirst({
        where: { airtable_id: input.oppId },
      });
      const zones = await db.zones.findMany({});

      if (!opp) return null;
      if (zones.length === 0) return opp;

      // Create a quick lookup map for zone names
      const zoneMap = new Map<string, (typeof zones)[number]>();
      for (const zone of zones) {
        if (zone.name) {
          zoneMap.set(zone.name, zone);
        }
      }

      // For each opportunity, map zone names to zone objects
      const enrichedOppFn = () => {
        const oppZones = (opp.zone ?? [])
          .map((zoneName) => zoneMap.get(zoneName))
          .filter(Boolean);
        return {
          ...opp,
          zones: oppZones, // we add a new field 'zones' which has the full zone objects
        };
      };
      const enrichedOpp = enrichedOppFn();

      return enrichedOpp;
    }),
  getAllOpportunitiesWithZonesLimit: publicProcedure
    .input(z.object({ limit: z.number(), page: z.number().min(1).max(100) })) // Added page parameter
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
        type: z.array(z.string().max(20)).optional().default([]),
        zoneIds: z.array(z.string().max(20)).optional().default([]), //zone names
        page: z.number().optional().default(1),
        limit: z.number().optional().default(8),
        excludeOppIds: z.array(z.string()).optional().default([]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, type, zoneIds, page, limit, excludeOppIds } = input;
      const skip = (page - 1) * limit;

      // Define the where clause with proper typing
      const whereClause: Prisma.OppsWhereInput = {};

      // Track if we're doing zone filtering to handle the special case
      const hasZoneFilter = zoneIds && zoneIds.length > 0;

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

      if (excludeOppIds.length > 0) {
        whereClause.AND = whereClause.AND ?? [];
        (whereClause.AND as Prisma.OppsWhereInput[]).push({
          airtable_id: { notIn: excludeOppIds },
        });
      }

      if (type && type.length > 0) {
        whereClause.type = { hasSome: type };
      }

      // First, run the query with OR logic to get all opportunities with ANY of the requested zones
      const initialWhereClause = { ...whereClause };
      if (hasZoneFilter) {
        initialWhereClause.zone = {
          hasSome: zoneIds,
        };
      }

      // Execute search query to get all matching opps
      const allOpps = await ctx.db.opps.findMany({
        where: initialWhereClause,
        orderBy: {
          created_at: "desc",
        },
      });

      // Post-process to separate perfect matches from partial matches
      let perfectMatches: typeof allOpps = [];
      const partialMatches: typeof allOpps = [];

      // Process the results to identify perfect and partial matches
      if (hasZoneFilter && allOpps.length > 0) {
        // For each opportunity, check if it contains ALL requested zones
        allOpps.forEach((opp) => {
          const oppZones = opp.zone || [];
          // Check if ALL requested zones are present in this opportunity
          const hasAllZones = zoneIds.every((zoneId) =>
            oppZones.includes(zoneId),
          );

          if (hasAllZones) {
            perfectMatches.push(opp);
          } else {
            partialMatches.push(opp);
          }
        });
      } else {
        // If no zone filtering, all matches are considered "perfect"
        perfectMatches = allOpps;
      }

      // Combine perfect matches first, then partial matches
      const sortedOpps = [...perfectMatches, ...partialMatches];

      // Apply pagination to the sorted results
      const paginatedOpps = sortedOpps.slice(skip, skip + limit);

      // Fetch zones for enriched opps
      const zones = await db.zones.findMany({});

      // Create a quick lookup map for zone names
      const zoneMap = new Map<string, (typeof zones)[number]>();
      for (const zone of zones) {
        if (zone.name) {
          zoneMap.set(zone.name, zone);
        }
      }

      // Enrich the paginated opportunities with zone objects
      const enrichedOpps = paginatedOpps.map((opp) => {
        const oppZones = (opp.zone ?? [])
          .map((zoneName) => zoneMap.get(zoneName))
          .filter(Boolean);
        return {
          ...opp,
          zones: oppZones, // we add a new field 'zones' which has the full zone objects
        };
      });

      return {
        opps: enrichedOpps,
        totalOpps: allOpps.length,
      };
    }),
});
