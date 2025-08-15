// src/server/api/routers/activity.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const activityRouter = createTRPCRouter({
  logActivity: publicProcedure
    .input(z.object({
      guestId: z.string().optional(),
      activityType: z.enum(['page_view', 'click', 'interaction']),
      url: z.string(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const guestId = userId ? null : input.guestId;
      
      if (!userId && !guestId) {
        throw new Error('Either user must be logged in or guestId must be provided');
      }

      return await ctx.db.activity.create({
        data: {
          userId,
          guestId,
          activityType: input.activityType,
          url: input.url,
          metadata: input.metadata,
          timestamp: new Date(),
        },
      });
    }),

  getUserActivity: publicProcedure
    .input(z.object({ guestId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      
      if (userId) {
        return await ctx.db.activity.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
        });
      } else if (input.guestId) {
        return await ctx.db.activity.findMany({
          where: { guestId: input.guestId, userId: null },
          orderBy: { timestamp: 'desc' },
        });
      }
      
      return [];
    }),

  mergeGuestActivities: protectedProcedure
    .input(z.object({ guestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      return await ctx.db.activity.updateMany({
        where: { guestId: input.guestId, userId: null },
        data: { userId, guestId: null },
      });
    }),
});