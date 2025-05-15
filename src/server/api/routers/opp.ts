import { z } from "zod";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";

const activeOppsFilter = {
  AND: [
    { status: "Active" },
    { status: { not: null } },
    { deadline: { gt: new Date() } },
  ],
};

type FetchAllZonesReturnType = Awaited<ReturnType<typeof fetchAllZones>>;
let zonesCache: FetchAllZonesReturnType | null = null;
let zonesCacheExpiry = 0;
const CACHE_TTL = 20 * 60 * 1000;
async function fetchAllZones(): Promise<ZoneType[]> {
  const now = Date.now();
  if (now > zonesCacheExpiry || !zonesCache) {
    try {
      zonesCache = await db.zones.findMany({});
      zonesCacheExpiry = now + CACHE_TTL;
    } catch (error) {
      // Fallback to empty array if there's an error
      console.error("Failed to fetch zones:", error);
      return [];
    }
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

      // Build the where clause more efficiently
      const whereClause: Prisma.OppsWhereInput = {
        status: "Active",
        deadline: { gt: new Date() },
        ...(excludeOppIds.length > 0 && {
          airtable_id: { notIn: excludeOppIds },
        }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { caption: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(type.length > 0 && { type: { hasSome: type } }),
        ...(zoneIds.length > 0 && { zone: { hasSome: zoneIds } }),
      };

      // Get zones first since we need them for filtering
      const zones = await fetchAllZones();
      const zoneMap = buildZoneMap(zones);

      // Use a single count + findMany query with proper pagination
      const [totalOpps, opps] = await Promise.all([
        db.opps.count({ where: whereClause }),
        db.opps.findMany({
          where: whereClause,
          take: limit,
          skip,
          orderBy: { created_at: "desc" },
        }),
      ]);

      // Early return if no results
      if (opps.length === 0) {
        return { opps: [], totalOpps };
      }

      return {
        opps: enrichOppsWithZones(opps, zoneMap),
        totalOpps,
      };
    }),
});
