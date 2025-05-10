import { z } from "zod";
import { db } from "@/server/db";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";

// Create a new type for guest session data
type GuestSessionData = {
  fetchCount: number;
  lastFetchTime: number;
  cachedOpportunities: OppWithZoneType[];
};

function getActiveOppsFilter() {
  const now = new Date();
  return {
    AND: [
      {
        OR: [{ status: "Active" }, { status: { startsWith: "Active" } }],
      },
      { status: { not: { contains: "Completed" } } },
      { deadline: { gt: now } },
    ],
  };
}
// In-memory cache for guest sessions (in production, use Redis or similar)
const guestSessions = new Map<string, GuestSessionData>();

export const userOppRouter = createTRPCRouter({
  // New public procedure that works for both authenticated and guest users
  getOpportunities: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        guestId: z.string().optional(), // For identifying guest users
        seenOppIds: z.array(z.string()).optional(), // Array of airtable_ids the guest has already seen
      }),
    )
    .query(async ({ ctx, input }) => {
      const LIMIT = input?.limit ?? 8;
      const isAuthenticated = !!ctx.session?.user;

      // For authenticated users, use the existing logic
      if (isAuthenticated && ctx.session) {
        return await getFYOppsForAuthenticatedUser(ctx.session.user.id, LIMIT);
      }

      // For guest users
      if (!input.guestId) {
        throw new Error("Guest ID is required for unauthenticated requests");
      }

      // Check if guest has a session
      if (!guestSessions.has(input.guestId)) {
        guestSessions.set(input.guestId, {
          fetchCount: 0,
          lastFetchTime: Date.now(),
          cachedOpportunities: [],
        });
      }

      const guestSession = guestSessions.get(input.guestId)!;

      // Return cached data if available and not expired
      if (guestSession.cachedOpportunities.length > 0) {
        // Filter out any opps the user has already seen

        if (input.seenOppIds && input.seenOppIds.length > 0) {
          const filtered = guestSession.cachedOpportunities.filter(
            (opp: { airtable_id?: string }) =>
              !input.seenOppIds?.includes(opp.airtable_id ?? ""),
          );

          if (filtered.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return filtered;
          }
        }
      }

      // Check if guest has exceeded the fetch limit (3)
      if (guestSession.fetchCount >= 3) {
        return {
          limitReached: true,
          message:
            "You've reached the limit of 3 fetches as a guest. Please sign in for more opportunities.",
          cachedOpportunities: guestSession.cachedOpportunities,
        };
      }
      let randomOpps = [];
      if (input.seenOppIds && input.seenOppIds.length > 0) {
        const allOpps = await db.opps.findMany({
          where: {
            airtable_id: {
              notIn: input.seenOppIds ?? [],
            },
            ...getActiveOppsFilter(),
          },
          select: { id: true },
        });
        const shuffledIds = allOpps
          .map((o) => o.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, LIMIT);

        // Step 3: Fetch actual opps
        randomOpps = await db.opps.findMany({
          where: { id: { in: shuffledIds }, ...getActiveOppsFilter() },
        });
      } else {
        randomOpps = await db.opps.findMany({
          take: LIMIT * 2, // Fetch more than needed to account for filtering
          orderBy: { created_at: "desc" },
          where: {
            ...getActiveOppsFilter(),
          },
        });
      }

      randomOpps = randomOpps.slice(0, LIMIT);

      // Enrich with zone information
      const zones = await db.zones.findMany({});
      const zoneMap = new Map();
      for (const zone of zones) {
        if (zone.name) {
          zoneMap.set(zone.name, zone);
        }
      }

      const enrichedOpps = randomOpps.map((opp) => {
        const oppZones = (opp.zone ?? [])
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          .map((zoneName) => zoneMap.get(zoneName))
          .filter(Boolean);
        return {
          ...opp,
          zones: oppZones,
        };
      });

      // Update guest session
      guestSession.fetchCount += 1;
      guestSession.lastFetchTime = Date.now();
      guestSession.cachedOpportunities = enrichedOpps;
      guestSessions.set(input.guestId, guestSession);

      return enrichedOpps;
    }),

  // Keep the original protected procedures
  getFYOpps: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const LIMIT = input?.limit ?? 8;

      return await getFYOppsForAuthenticatedUser(userId, LIMIT);
    }),

  createOrUpdate: protectedProcedure
    .input(
      z.object({
        oppId: z.bigint(),
        liked: z.boolean().optional(),
        saved: z.boolean().optional(),
        clicked: z.boolean().optional(),
        applied: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await db.userOpportunity.findUnique({
        where: {
          userId_oppId: {
            userId,
            oppId: input.oppId,
          },
        },
      });

      if (existing) {
        return await db.userOpportunity.update({
          where: {
            userId_oppId: {
              userId,
              oppId: input.oppId,
            },
          },
          data: {
            liked: input.liked ?? existing.liked,
            saved: input.saved ?? existing.saved,
            clicked: input.clicked ?? existing.clicked,
            applied: input.applied ?? existing.applied,
          },
        });
      }

      return await db.userOpportunity.create({
        data: {
          userId,
          oppId: input.oppId,
          liked: input.liked ?? false,
          saved: input.saved ?? false,
          clicked: input.clicked ?? false,
          applied: input.applied ?? false,
        },
      });
    }),
});

// Helper function to get opportunities for authenticated users
async function getFYOppsForAuthenticatedUser(userId: string, LIMIT: number) {
  const interactions = await db.userOpportunity.findMany({
    where: {
      userId,
      OR: [{ liked: true }, { saved: true }, { applied: true }],
    },
    select: { oppId: true },
  });
  const interactedOppIds = interactions.map((i) => i.oppId);

  const seen = await db.userOpportunity.findMany({
    where: { userId },
    select: { oppId: true },
  });
  const seenOppIds = seen.map((i) => i.oppId);

  const likedOpps = await db.opps.findMany({
    where: { id: { in: interactedOppIds } },
    select: { type: true, zone: true },
  });

  const typeCounts: Record<string, number> = {};
  const zoneCounts: Record<string, number> = {};

  for (const opp of likedOpps) {
    for (const t of opp.type) typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    for (const z of opp.zone) zoneCounts[z] = (zoneCounts[z] ?? 0) + 1;
  }

  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  const topZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([zone]) => zone);

  // ✅ Build where clause using array
  const whereClauses: Prisma.OppsWhereInput[] = [];

  whereClauses.push(getActiveOppsFilter());
  whereClauses.push({ id: { notIn: seenOppIds } });

  if (topTypes.length > 0) {
    whereClauses.push({ type: { hasSome: topTypes } });
  }

  if (topZones.length > 0) {
    whereClauses.push({ zone: { hasSome: topZones } });
  }

  let recommendedOpps = await db.opps.findMany({
    where: {
      AND: whereClauses,
    },
    take: LIMIT,
    orderBy: { created_at: "desc" },
  });

  // Fallback filler
  if (recommendedOpps.length < LIMIT) {
    const allfillerOpps = await db.opps.findMany({
      where: {
        ...getActiveOppsFilter(),
        id: {
          notIn: [...interactedOppIds, ...recommendedOpps.map((o) => o.id)],
        },
      },
      select: { id: true },
      orderBy: { created_at: "desc" },
    });

    const shuffledIds = allfillerOpps
      .map((o) => o.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, LIMIT - recommendedOpps.length);

    const fillerOpps = await db.opps.findMany({
      where: { id: { in: shuffledIds }, ...getActiveOppsFilter() },
    });

    recommendedOpps = [...recommendedOpps, ...fillerOpps];
  }

  // Enrich with zones
  const zones = await db.zones.findMany({});
  const zoneMap = new Map();
  for (const zone of zones) {
    if (zone.name) {
      zoneMap.set(zone.name, zone);
    }
  }

  const enrichedOpps = recommendedOpps.map((opp) => {
    const oppZones = (opp.zone ?? [])
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .map((zoneName) => zoneMap.get(zoneName))
      .filter(Boolean);
    return {
      ...opp,
      zones: oppZones,
    };
  });

  return enrichedOpps.slice(0, LIMIT);
}
