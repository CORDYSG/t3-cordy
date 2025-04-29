import { z } from "zod";
import { db } from "@/server/db";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const userOppRouter = createTRPCRouter({
  getFYOpps: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const LIMIT = input?.limit ?? 8;

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
          AND: [
            { type: { hasSome: topTypes } },
            { zone: { hasSome: topZones } },
          ],
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
          orderBy: { created_at: "desc" }, // or add random sort later
        });

        recommendedOpps = [...recommendedOpps, ...fillerOpps];
      }

      const zones = await db.zones.findMany({});

      // Create a quick lookup map for zone names
      const zoneMap = new Map<string, (typeof zones)[number]>();
      for (const zone of zones) {
        if (zone.name) {
          zoneMap.set(zone.name, zone);
        }
      }
      const enrichedOpps = recommendedOpps.map((opp) => {
        const oppZones = (opp.zone ?? [])
          .map((zoneName) => zoneMap.get(zoneName))
          .filter(Boolean);
        return {
          ...opp,
          zones: oppZones, // we add a new field 'zones' which has the full zone objects
        };
      });

      return enrichedOpps.slice(0, LIMIT);
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
