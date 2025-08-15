/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import { db } from "@/server/db";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { UserActionType, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Create a new type for guest session data
type GuestSessionData = {
  fetchCount: number;
  lastFetchTime: number;
  cachedOpportunities: OppWithZoneType[];
};
type ZoneType = Awaited<ReturnType<typeof db.zones.findFirst>>;
type OppType = Awaited<ReturnType<typeof db.opps.findFirst>>;

type EnrichedOpp = OppType & {
  zones: ZoneType[];
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
            return filtered as EnrichedOpp[];
          }
        }
      }

      // Check if guest has exceeded the fetch limit (3)
      if (guestSession.fetchCount >= 1) {
        return {
          limitReached: true,
          message:
            "You've reached the limit of opportunities. Please sign in for more opportunities.",
          cachedOpportunities: guestSession.cachedOpportunities,
        };
      }
      let randomOpps: OppType[] = [];
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
        const oppZones = (opp?.zone ?? [])
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

  // Add this procedure to your userOppRouter

  hasSwipedBefore: publicProcedure
    .input(
      z.object({
        guestId: z.string().optional(), // For guest users
      }),
    )
    .query(async ({ ctx, input }) => {
      const isAuthenticated = !!ctx.session?.user;

      // For authenticated users, check database
      if (isAuthenticated && ctx.session) {
        const userId = ctx.session.user.id;

        // Also check if user has any recorded actions
        const userActions = await db.userAction.findFirst({
          where: {
            userId,
            actionType: {
              in: [UserActionType.LIKE, UserActionType.UNLIKE],
            },
          },
        });

        return {
          hasSwipedBefore: !!userActions,
          isAuthenticated: true,
        };
      }

      // For guest users, check in-memory session
      if (!input.guestId) {
        return {
          hasSwipedBefore: false,
          isAuthenticated: false,
        };
      }

      const guestSession = guestSessions.get(input.guestId);

      if (!guestSession) {
        return {
          hasSwipedBefore: false,
          isAuthenticated: false,
        };
      }

      // Check if guest has any recorded actions
      const guestActions = await db.userAction.findFirst({
        where: {
          guestId: input.guestId,
          actionType: {
            in: [UserActionType.LIKE, UserActionType.UNLIKE],
          },
        },
      });

      return {
        hasSwipedBefore: !!guestActions,
        isAuthenticated: false,
      };
    }),

  // Keep the original protected procedures
  getFYOpps: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const LIMIT = input?.limit ?? 8;

      return await getFYOppsForAuthenticatedUser(userId, LIMIT);
    }),

  getUserOppMetrics: protectedProcedure
    .input(z.object({ oppId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        return null;
      }

      const userOpp = await db.userOpportunity.findUnique({
        where: {
          userId_oppId: {
            userId,
            oppId: BigInt(input.oppId),
          },
        },
      });
      if (!userOpp) {
        return {
          liked: false,
          saved: false,
          clicked: false,
          applied: false,
        };
      }

      return {
        liked: userOpp.liked,
        saved: userOpp.saved,
        clicked: userOpp.clicked,
        applied: userOpp.applied,
      };
    }),
  getUserOppMetricCounts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    if (!userId) {
      return null;
    }
    const metrics = await db.userOpportunity.findMany({
      where: { userId },
    });
    const counts = {
      liked: 0,
      saved: 0,
      clicked: 0,
      applied: 0,
      viewed: 0,
    };
    metrics.forEach((metric) => {
      if (metric.liked) counts.liked += 1;
      if (metric.saved) counts.saved += 1;
      if (metric.clicked) counts.clicked += 1;
      if (metric.applied) counts.applied += 1;
      counts.viewed += 1;
    });
    return counts;
  }),

  createOrUpdate: protectedProcedure
    .input(
      z.object({
        oppId: z.union([z.bigint(), z.number()]),
        liked: z.boolean().optional(),
        saved: z.boolean().optional(),
        clicked: z.boolean().optional(),
        applied: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
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

  createReportOpp: protectedProcedure
    .input(
      z.object({
        oppId: z.union([z.number(), z.bigint()]),
        reason: z.enum([
          "SPAM",
          "SCAM",
          "INAPPROPRIATE",
          "MISLEADING",
          "DUPLICATE",
          "OTHER_REPORT",
        ]),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const report = await ctx.db.reportedOpportunity.create({
        data: {
          userId: user.id,
          oppId: input.oppId,
          reason: input.reason,
          description: input.description,
        },
      });

      return report;
    }),

  updateUserOppMetrics: publicProcedure
    .input(
      z.object({
        page: z.string().optional(), // Optional page parameter for context
        oppId: z.union([z.number(), z.bigint()]),
        action: z.nativeEnum(UserActionType),
        guestId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;

      const guestId = input.guestId ?? null;

      return await db.$transaction(async (tx) => {
        // Log the action
        const action = await tx.userAction.create({
          data: {
            userId,
            guestId,
            oppId: BigInt(input.oppId),
            actionType: input.action,
            page: input.page ?? "CORDY", // Default to "CORDY" if not provided
          },
        });

        // Update aggregated metrics
        const updateData: any = {};
        const createData: any = { oppId: input.oppId };
        const isGuest = !userId;

        switch (input.action) {
          case UserActionType.VIEW:
            const viewField = isGuest ? "guestViewCount" : "viewCount";
            updateData[viewField] = { increment: 1 };
            createData[viewField] = 1;
            break;
          case UserActionType.LIKE:
            const likeField = isGuest ? "guestLikeCount" : "likeCount";
            updateData[likeField] = { increment: 1 };
            createData[likeField] = 1;
            break;
          case UserActionType.UNLIKE:
            const unlikeField = isGuest ? "guestLikeCount" : "likeCount";
            updateData[unlikeField] = { decrement: 1 };
            createData[unlikeField] = 0; // Start at 0 since we're decrementing
            break;
          case UserActionType.SAVE:
            const saveField = isGuest ? "guestSaveCount" : "saveCount";
            updateData[saveField] = { increment: 1 };
            createData[saveField] = 1;
            break;
          case UserActionType.UNSAVE:
            const unsaveField = isGuest ? "guestSaveCount" : "saveCount";
            updateData[unsaveField] = { decrement: 1 };
            createData[unsaveField] = 0;
            break;
          case UserActionType.CLICK:
            const clickField = isGuest ? "guestClickCount" : "clickCount";
            updateData[clickField] = { increment: 1 };
            createData[clickField] = 1;
            break;
          case UserActionType.CLICK_EXPAND:
            const clickExpandField = isGuest
              ? "guestClickExpandCount"
              : "clickExpandCount";
            updateData[clickExpandField] = { increment: 1 };
            createData[clickExpandField] = 1;
            break;
          case UserActionType.APPLY:
            const applyField = isGuest ? "guestApplyCount" : "clickApplyCount";
            updateData[applyField] = { increment: 1 };
            createData[applyField] = 1;
            break;
          case UserActionType.SHARE_TELEGRAM:
            const telegramField = isGuest
              ? "guestShareTelegramCount"
              : "shareTelegramCount";
            updateData[telegramField] = { increment: 1 };
            createData[telegramField] = 1;
            break;
          case UserActionType.SHARE_WHATSAPP:
            const whatsappField = isGuest
              ? "guestShareWhatsAppCount"
              : "shareWhatsAppCount";
            updateData[whatsappField] = { increment: 1 };
            createData[whatsappField] = 1;
            break;
          case UserActionType.SHARE_EMAIL:
            const emailField = isGuest
              ? "guestShareEmailCount"
              : "shareEmailCount";
            updateData[emailField] = { increment: 1 };
            createData[emailField] = 1;
            break;
          case UserActionType.SHARE_LINK:
            const linkField = isGuest
              ? "guestShareLinkCount"
              : "shareLinkCount";
            updateData[linkField] = { increment: 1 };
            createData[linkField] = 1;
            break;
          default:
            // If the action type is unknown, throw an error
            throw new Error(`Unknown action type: ${String(input.action)}`);
        }

        await tx.oppMetrics.upsert({
          where: { oppId: input.oppId },
          create: createData,
          update: updateData,
        });

        return { action, guestId };
      });
    }),
});

// Helper function to get opportunities for authenticated users
async function getFYOppsForAuthenticatedUser(userId: string, LIMIT: number) {
  const interactions = await db.userOpportunity.findMany({
    where: { userId },
    select: { oppId: true, liked: true, saved: true, applied: true },
  });

  // Separate positive and negative interactions
  const positiveInteractionIds = interactions
    .filter((i) => i.liked === true || i.saved === true || i.applied === true)
    .map((i) => i.oppId);

  const negativeInteractionIds = interactions
    .filter((i) => i.liked === false) // Explicitly disliked
    .map((i) => i.oppId);

  const seenOppIds = interactions.map((i) => i.oppId);

  // Get positive interactions for preference learning
  const likedOpps = await db.opps.findMany({
    where: { id: { in: positiveInteractionIds } },
    select: { type: true, zone: true },
  });

  // Get negative interactions to avoid similar recommendations
  const dislikedOpps = await db.opps.findMany({
    where: { id: { in: negativeInteractionIds } },
    select: { type: true, zone: true },
  });

  // Count positive preferences
  const typeCounts: Record<string, number> = {};
  const zoneCounts: Record<string, number> = {};

  for (const opp of likedOpps) {
    for (const t of opp.type) typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    for (const z of opp.zone) zoneCounts[z] = (zoneCounts[z] ?? 0) + 1;
  }

  // Count negative preferences (what user dislikes)
  const dislikedTypeCounts: Record<string, number> = {};
  const dislikedZoneCounts: Record<string, number> = {};

  for (const opp of dislikedOpps) {
    for (const t of opp.type)
      dislikedTypeCounts[t] = (dislikedTypeCounts[t] ?? 0) + 1;
    for (const z of opp.zone)
      dislikedZoneCounts[z] = (dislikedZoneCounts[z] ?? 0) + 1;
  }

  // Calculate net preference scores (positive - negative)
  const netTypeScores: Record<string, number> = {};
  const netZoneScores: Record<string, number> = {};

  // Calculate net scores for types
  for (const type in typeCounts) {
    if (typeCounts[type])
      netTypeScores[type] = typeCounts[type] - (dislikedTypeCounts[type] ?? 0);
  }
  // Include heavily disliked types with negative scores
  for (const type in dislikedTypeCounts) {
    if (!(type in netTypeScores)) {
      netTypeScores[type] = -(dislikedTypeCounts[type] ?? 0);
    }
  }

  // Calculate net scores for zones
  for (const zone in zoneCounts) {
    if (zoneCounts[zone])
      netZoneScores[zone] = zoneCounts[zone] - (dislikedZoneCounts[zone] ?? 0);
  }
  // Include heavily disliked zones with negative scores
  for (const zone in dislikedZoneCounts) {
    if (!(zone in netZoneScores)) {
      netZoneScores[zone] = -(dislikedZoneCounts[zone] ?? 0);
    }
  }

  // Get top preferred types/zones (positive net scores only)
  const topTypes = Object.entries(netTypeScores)
    .filter(([, score]) => score > 0) // Only positive net scores
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  const topZones = Object.entries(netZoneScores)
    .filter(([, score]) => score > 0) // Only positive net scores
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([zone]) => zone);

  // Get heavily disliked types/zones for deprioritization (not complete avoidance)
  const deprioritizeTypes = Object.entries(netTypeScores)
    .filter(([, score]) => score < -1) // Strongly negative (more than 1 net dislike)
    .map(([type]) => type);

  const deprioritizeZones = Object.entries(netZoneScores)
    .filter(([, score]) => score < -1) // Strongly negative (more than 1 net dislike)
    .map(([zone]) => zone);

  // Base where clause (no avoidance, just basic filtering)
  const baseWhere: Prisma.OppsWhereInput = {
    AND: [getActiveOppsFilter(), { id: { notIn: seenOppIds } }],
  };

  // Prefer liked types and zones (only if we have positive preferences)
  const preferenceClause: Prisma.OppsWhereInput[] = [];

  if (topTypes.length > 0) {
    preferenceClause.push({ type: { hasSome: topTypes } });
  }

  if (topZones.length > 0) {
    preferenceClause.push({ zone: { hasSome: topZones } });
  }

  const recommendedOpps: any[] = [];

  // Step 1: Get preferred content (majority of recommendations)
  if (preferenceClause.length > 0) {
    const preferredOpps = await db.opps.findMany({
      where: {
        AND: [baseWhere, { OR: preferenceClause }],
      },
      take: Math.max(1, Math.floor(LIMIT * 0.7)), // 70% preferred content
      orderBy: { created_at: "desc" },
    });
    recommendedOpps.push(...preferredOpps);
  }

  // Step 2: Add some deprioritized content (1-2 items) to give user a chance to reconsider
  if (
    recommendedOpps.length < LIMIT &&
    (deprioritizeTypes.length > 0 || deprioritizeZones.length > 0)
  ) {
    const excludeIds = [...seenOppIds, ...recommendedOpps.map((o) => o.id)];

    const deprioritizedClause: Prisma.OppsWhereInput[] = [];
    if (deprioritizeTypes.length > 0) {
      deprioritizedClause.push({ type: { hasSome: deprioritizeTypes } });
    }
    if (deprioritizeZones.length > 0) {
      deprioritizedClause.push({ zone: { hasSome: deprioritizeZones } });
    }

    const deprioritizedOpps = await db.opps.findMany({
      where: {
        AND: [
          getActiveOppsFilter(),
          { id: { notIn: excludeIds } },
          { OR: deprioritizedClause },
        ],
      },
      take: Math.min(2, LIMIT - recommendedOpps.length), // Max 2 deprioritized items
      orderBy: { created_at: "desc" },
    });

    recommendedOpps.push(...deprioritizedOpps);
  }

  // Step 3: Fill remaining slots with neutral content (everything else)
  if (recommendedOpps.length < LIMIT) {
    const excludeIds = [...seenOppIds, ...recommendedOpps.map((o) => o.id)];

    const allRemainingOpps = await db.opps.findMany({
      where: {
        AND: [getActiveOppsFilter(), { id: { notIn: excludeIds } }],
      },
      select: { id: true },
      orderBy: { created_at: "desc" },
    });

    const shuffledIds = allRemainingOpps
      .map((o) => o.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, LIMIT - recommendedOpps.length);

    const fillerOpps = await db.opps.findMany({
      where: {
        id: { in: shuffledIds },
        ...getActiveOppsFilter(),
      },
    });

    recommendedOpps.push(...fillerOpps);
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
      .map((zoneName: string) => zoneMap.get(zoneName))
      .filter(Boolean);
    return {
      ...opp,
      zones: oppZones,
    };
  });

  return enrichedOpps.slice(0, LIMIT);
}
