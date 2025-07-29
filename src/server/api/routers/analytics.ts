import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { calculateBadges } from "@/lib/analytics/badges";
import { analyzePersonality } from "@/lib/analytics/personality";
import { calculateStreak } from "@/lib/analytics/streak";
import type { UserAnalytics } from "types/analytics";

export const analyticsRouter = createTRPCRouter({
  getUserAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      // Get user actions and opportunities
      const [userActions, userOpportunities, userProfile] = await Promise.all([
        ctx.db.userAction.findMany({
          where: { userId },
          include: {
            opp: {
              include: {
                metrics: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.userOpportunity.findMany({
          where: { userId },
          include: {
            opportunity: true
          }
        }),
        ctx.db.userProfile.findUnique({
          where: { userId },
          include: {
            interestZones: {
              include: {
                zone: true
              }
            }
          }
        })
      ]);

      // Calculate basic stats
      const totalViews = userActions.filter(a => a.actionType === 'VIEW').length;
      const totalLikes = userActions.filter(a => a.actionType === 'LIKE').length;
      const totalSaves = userActions.filter(a => a.actionType === 'SAVE').length;
      const totalApplied = userActions.filter(a => a.actionType === 'APPLY').length;
      const totalClicks = userActions.filter(a => a.actionType === 'CLICK').length;

      // Calculate explorer rate (likes/views)
      const explorerRate = totalViews > 0 ? totalLikes / totalViews : 0;
      
      // Calculate pickiness (saves/likes)
      const pickiness = totalLikes > 0 ? totalSaves / totalLikes : 0;

      // Calculate interest diversity
      const uniqueTypes = new Set<string>();
      userActions.forEach(action => {
        if (action.opp?.type && Array.isArray(action.opp.type)) {
          action.opp.type.forEach((type: string) => uniqueTypes.add(type));
        }
      });
      const interestDiversity = uniqueTypes.size / 10; // Assuming 10 total categories

      // Find top interest
      const typeCount: Record<string, number> = {};
      userActions.forEach(action => {
        if (action.opp?.type && Array.isArray(action.opp.type)) {
          action.opp.type.forEach((type: string) => {
            typeCount[type] = (typeCount[type] ?? 0) + 1;
          });
        }
      });

   const topInterest = Object.entries(typeCount).length > 0 
  ? Object.entries(typeCount).reduce((a, b) => a[1] > b[1] ? a : b)
  : ['General', 0] as [string, number];

      // Calculate activity patterns
      const weekendActions = userActions.filter(action => {
        const day = new Date(action.createdAt).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
      const weekendRatio = userActions.length > 0 ? weekendActions.length / userActions.length : 0;

      // Calculate design-specific views (if you have design category)
      const designViews = userActions.filter(action => 
        action.opp?.type?.some((type: string) => 
          type.toLowerCase().includes('design') || 
          type.toLowerCase().includes('art') ||
          type.toLowerCase().includes('creative')
        )
      ).length;

      // Calculate streak
      const streak = calculateStreak(userActions);

      const stats = {
        totalViews,
        totalLikes,
        totalSaves,
        totalApplied,
        totalClicks,
        explorerRate,
        pickiness,
        interestDiversity,
    topInterest: {
  category: topInterest[0] ,
  percentage: totalViews > 0 ? Math.round((topInterest[1]  / totalViews) * 100) : 0
},  
        weekendRatio,
        designViews,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastActiveDate: streak.lastActiveDate
      };

      // Generate badges
      const badges = calculateBadges(stats);

      // Analyze personality
      const personality = analyzePersonality(stats);

      // Determine activity pattern
      const activityPattern = {
        mostActiveTime: weekendRatio > 0.6 ? 'Weekends' : weekendRatio < 0.4 ? 'Weekdays' : 'Mixed',
        pattern: weekendRatio > 0.6 ? 'weekends' as const : weekendRatio < 0.4 ? 'weekdays' as const : 'mixed' as const
      };

      const analytics: UserAnalytics = {
        streak: {
          current: streak.current,
          longest: streak.longest,
          lastActiveDate: streak.lastActiveDate
        },
        explorerRate,
        topInterest: stats.topInterest,
        activityPattern,
        badges,
        personality,
        stats: {
          totalViews,
          totalLikes,
          totalSaves,
          totalApplied,
          pickiness,
          interestDiversity
        }
      };

      return analytics;
    }),

  getBadgeProgress: protectedProcedure
    .input(z.object({ badgeId: z.string() }))
    .query(async ({ ctx, input }) => {
      // This could be used for real-time badge progress updates
      const userId = ctx.session.user.id;
      
      // Implementation would depend on specific badge requirements
      // For now, return basic structure
      return {
        badgeId: input.badgeId,
        progress: 0,
        maxProgress: 100,
        earned: false
      };
    })
});
