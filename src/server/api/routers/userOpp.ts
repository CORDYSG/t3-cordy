import { z } from "zod";
import { db } from "@/server/db";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

// Create a new type for guest session data
type GuestSessionData = {
  fetchCount: number;
  lastFetchTime: number;
  cachedOpportunities: OppWithZoneType[];
};

// In-memory cache for guest sessions (in production, use Redis or similar)
const guestSessions = new Map<string, GuestSessionData>();

export const userOppRouter = createTRPCRouter({
  // New public procedure that works for both authenticated and guest users
  getOpportunities: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        guestId: z.string().optional(), // For identifying guest users
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return guestSession.cachedOpportunities;
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

      // Fetch random opportunities for guests
      const randomOpps = await db.opps.findMany({
        take: LIMIT,
        orderBy: { created_at: "desc" },
      });

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
  // Step 1: Get user interactions
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

  // Step 2: Fetch those opps to derive type/zone prefs
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

  // Step 3: Recommend similar opps
  let recommendedOpps = await db.opps.findMany({
    where: {
      id: { notIn: seenOppIds },
      AND: [{ type: { hasSome: topTypes } }, { zone: { hasSome: topZones } }],
    },
    take: LIMIT,
    orderBy: { created_at: "desc" },
  });

  // Step 4: Random filler if not enough
  if (recommendedOpps.length < LIMIT) {
    const fillerOpps = await db.opps.findMany({
      where: {
        id: {
          notIn: [...interactedOppIds, ...recommendedOpps.map((o) => o.id)],
        },
      },
      take: LIMIT - recommendedOpps.length,
      orderBy: { created_at: "desc" },
    });

    recommendedOpps = [...recommendedOpps, ...fillerOpps];
  }

  const zones = await db.zones.findMany({});

  // Create a quick lookup map for zone names
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
