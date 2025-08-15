import { z } from "zod";
import { db } from "@/server/db";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
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

export const communityOppRouter = createTRPCRouter({
  getCommunity: publicProcedure
    .input(z.object({ organisationShortName: z.string() }))
    .query(async ({ input }) => {
      const { organisationShortName } = input;
      console.log("<>>>>>> Fetching community for:", organisationShortName);
      const community = await db.community.findFirst({
        where: {
          abbreviation: { equals: organisationShortName, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          abbreviation: true,
        },
      });
      if (!community) {
        throw new Error("Community not found");
      }
      return community;
    }),

  getAllCommunityOpportunitiesWithZonesLimit: publicProcedure
    .input(
      z.object({
        organisationFullName: z.string(),
        organisationShortName: z.string(),
        limit: z.number(),
        page: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input }) => {
      const { organisationFullName, organisationShortName, limit, page } =
        input;
      const skip = (page - 1) * limit;

      const orgFilter: Prisma.OppsWhereInput = {
        OR: [
          {
            organisation: {
              contains: organisationShortName,
              mode: "insensitive",
            },
          },
          {
            organisation: {
              contains: organisationFullName,
              mode: "insensitive",
            },
          },
        ],
      };

      const finalWhere: Prisma.OppsWhereInput = {
        ...activeOppsFilter,
        ...orgFilter,
      };

      const [opps, totalOpps, zones] = await Promise.all([
        db.opps.findMany({
          where: finalWhere,
          take: limit,
          skip,
          orderBy: { created_at: "desc" },
        }),
        db.opps.count({
          where: finalWhere,
        }),
        fetchAllZones(),
      ]);

      if (opps.length === 0) return { opps: [], totalOpps };
      if (zones.length === 0) return { opps, totalOpps };

      const zoneMap = buildZoneMap(zones);
      const enrichedOpps = enrichOppsWithZones(opps, zoneMap);

      return { opps: enrichedOpps, totalOpps };
    }),

  searchCommunityOpportunities: publicProcedure
    .input(
      z.object({
        organisationFullName: z.string(),
        organisationShortName: z.string(),
        search: z.string().optional().default(""),
        type: z.array(z.string().max(20)).optional().default([]),
        zoneIds: z.array(z.string().max(20)).optional().default([]), //zone names
        page: z.number().optional().default(1),
        limit: z.number().optional().default(8),
        excludeOppIds: z.array(z.string()).optional().default([]),
        sortBy: z
          .enum(["newest", "oldest", "deadline-asc", "deadline-desc"])
          .optional()
          .default("newest"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        organisationFullName,
        organisationShortName,
        search,
        type,
        zoneIds,
        page,
        limit,
        excludeOppIds,
        sortBy,
      } = input;
      const skip = (page - 1) * limit;
      console.log("Searching community opportunities with params:", {
        organisationFullName,
        organisationShortName,
        search,
        type,
        zoneIds,
        page,
        limit,
        excludeOppIds,
        sortBy,
      });
      const orgFilter: Prisma.OppsWhereInput = {
        OR: [
          {
            organisation: {
              contains: organisationShortName,
              mode: "insensitive",
            },
          },
          {
            organisation: {
              contains: organisationFullName,
              mode: "insensitive",
            },
          },
        ],
      };

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
        ...orgFilter,
      };

      // Build the orderBy clause based on sortBy parameter
      const getOrderByClause = (
        sortBy: string,
      ): Prisma.OppsOrderByWithRelationInput => {
        switch (sortBy) {
          case "newest":
            return { created_at: "desc" };
          case "oldest":
            return { created_at: "asc" };
          case "deadline-asc":
            return { deadline: "asc" };
          case "deadline-desc":
            return { deadline: "desc" };
          default:
            return { created_at: "desc" };
        }
      };

      // Get zones first since we need them for filtering
      const zones = await fetchAllZones();
      const zoneMap = buildZoneMap(zones);

      console.log();

      // Use a single count + findMany query with proper pagination
      const [totalOpps, opps] = await Promise.all([
        db.opps.count({ where: whereClause }),
        db.opps.findMany({
          where: whereClause,
          take: limit,
          skip,
          orderBy: getOrderByClause(sortBy),
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
