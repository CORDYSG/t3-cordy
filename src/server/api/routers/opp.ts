import { z } from "zod";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";

const activeOppsFilter = {
  AND: [{ status: "Active" }, { status: { not: null } }],
};

let zonesCache: Awaited<ReturnType<typeof fetchAllZones>> = [];
let zonesCacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function fetchAllZones(): Promise<
  Awaited<ReturnType<typeof db.zones.findMany>>
> {
  const now = Date.now();
  if (now > zonesCacheExpiry || zonesCache.length === 0) {
    // Cache is expired or empty, fetch fresh data
    zonesCache = await db.zones.findMany();
    zonesCacheExpiry = now + CACHE_TTL;
  }
  return zonesCache;
}

function buildZoneMap(zones: Awaited<ReturnType<typeof fetchAllZones>>) {
  const zoneMap = new Map<string, (typeof zones)[number]>();
  for (const zone of zones) {
    if (zone.name) {
      zoneMap.set(zone.name, zone);
    }
  }
  return zoneMap;
}

// Helper function to enrich opportunities with zone objects
function enrichOppsWithZones(
  opps: Array<{ zone?: string[] }>,
  zoneMap: ReturnType<typeof buildZoneMap>,
) {
  return opps.map((opp) => {
    const oppZones = (opp.zone ?? [])
      .map((zoneName) => zoneMap.get(zoneName))
      .filter((zone): zone is NonNullable<typeof zone> => Boolean(zone));
    return {
      ...opp,
      zones: oppZones,
    };
  });
}

export const oppRouter = createTRPCRouter({
  getAllOpportunitiesWithZones: publicProcedure.query(async () => {
    const [opps, zones] = await Promise.all([
      db.opps.findMany({
        where: activeOppsFilter,
        // Add index hint if you have appropriate indices
        // orderBy: { created_at: "desc" },
      }),
      fetchAllZones(),
    ]);

    if (opps.length === 0) return [];
    if (zones.length === 0) return opps;

    // Create a quick lookup map for zone names
    const zoneMap = buildZoneMap(zones);
    return enrichOppsWithZones(opps, zoneMap);
  }),
  getOppById: publicProcedure
    .input(z.object({ oppId: z.string() }))
    .query(async ({ input }) => {
      const [opp, zones] = await Promise.all([
        db.opps.findFirst({
          where: {
            airtable_id: input.oppId,
            ...activeOppsFilter,
          },
        }),
        fetchAllZones(),
      ]);

      if (!opp) return null;
      if (zones.length === 0) return opp;

      // Create a quick lookup map for zone names
      const zoneMap = buildZoneMap(zones);
      const oppZones = (opp.zone ?? [])
        .map((zoneName) => zoneMap.get(zoneName))
        .filter(Boolean);

      return {
        ...opp,
        zones: oppZones,
      };
    }),
  getAllOpportunitiesWithZonesLimit: publicProcedure
    .input(z.object({ limit: z.number(), page: z.number().min(1).max(100) })) // Added page parameter
    .query(async ({ input }) => {
      const { limit, page } = input;
      const skip = (page - 1) * limit; // Calculate the number of records to skip

      const [opps, totalOpps, zones] = await Promise.all([
        db.opps.findMany({
          where: activeOppsFilter,
          take: limit,
          skip: skip,
          orderBy: { created_at: "desc" }, // Add consistent sorting
        }),
        db.opps.count({
          where: activeOppsFilter,
        }),
        fetchAllZones(),
      ]);

      if (opps.length === 0) return { opps: [], totalOpps };
      if (zones.length === 0) return { opps, totalOpps };

      const zoneMap = buildZoneMap(zones);
      const enrichedOpps = enrichOppsWithZones(opps, zoneMap);

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
      whereClause.AND = whereClause.AND ?? [];
      (whereClause.AND as Prisma.OppsWhereInput[]).push(activeOppsFilter);

      // First, run the query with OR logic to get all opportunities with ANY of the requested zones
      const initialWhereClause = { ...whereClause };
      if (hasZoneFilter) {
        initialWhereClause.zone = {
          hasSome: zoneIds,
        };
      }

      // Run queries in parallel
      const [allOpps, zones] = await Promise.all([
        db.opps.findMany({
          where: initialWhereClause,
          orderBy: {
            created_at: "desc",
          },
        }),
        fetchAllZones(),
      ]);

      // Process results efficiently
      let sortedOpps = allOpps;

      if (hasZoneFilter && allOpps.length > 0) {
        // Separate perfect and partial matches
        const perfectMatches: typeof allOpps = [];
        const partialMatches: typeof allOpps = [];

        for (const opp of allOpps) {
          const oppZones = opp.zone || [];
          // Check if ALL requested zones are present
          const hasAllZones = zoneIds.every((zoneId) =>
            oppZones.includes(zoneId),
          );

          if (hasAllZones) {
            perfectMatches.push(opp);
          } else {
            partialMatches.push(opp);
          }
        }

        sortedOpps = [...perfectMatches, ...partialMatches];
      }

      // Apply pagination efficiently
      const paginatedOpps = sortedOpps.slice(skip, skip + limit);
      const zoneMap = buildZoneMap(zones);
      const enrichedOpps = enrichOppsWithZones(paginatedOpps, zoneMap);

      return {
        opps: enrichedOpps,
        totalOpps: sortedOpps.length,
      };
    }),
});
