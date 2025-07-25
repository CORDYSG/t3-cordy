import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { subDays, subMonths, startOfDay, addDays, format, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const allActionTypes = ["LIKE", "UNLIKE", "SAVE", "UNSAVE", "CLICK"] as const;

type ActionType = typeof allActionTypes[number];

type ActionCounts = {
  date: string;
} & Record<ActionType, number>;


// Configuration for timezone
const APP_TIMEZONE = 'Asia/Singapore';

// Helper functions for timezone handling
const toAppTimezone = (date: Date): Date => {
  return toZonedTime(date, APP_TIMEZONE);
};

const startOfDayInAppTimezone = (date: Date): Date => {
  const sgtDate = toAppTimezone(date);
  return startOfDay(sgtDate);
};

const formatDateKey = (date: Date): string => {
  const sgtDate = toAppTimezone(date);
  return startOfDay(sgtDate).toISOString();
};

const formatMonthKey = (date: Date): string => {
  const sgtDate = toAppTimezone(date);
  return `${sgtDate.getFullYear()}-${String(sgtDate.getMonth() + 1).padStart(2, '0')}`;
};

const createDateRange = (since: Date, until: Date, dailyData: Record<string, number>) => {
  const dateRange: { date: string; count: number }[] = [];
  let currentDate = startOfDayInAppTimezone(since);
  const untilSGT = startOfDayInAppTimezone(until);

  while (currentDate <= untilSGT) {
    const dayKey = formatDateKey(currentDate);
    dateRange.push({
      date: dayKey,
      count: dailyData[dayKey] ?? 0,
    });

    // ✅ Advance by 1 day in SGT
    currentDate = startOfDayInAppTimezone(addDays(currentDate, 1));
  }

  return dateRange;
};

export const adminRouter = createTRPCRouter({
  totalUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.count();
  }),

  activeOpportunities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.opps.count({
      where: { status: { equals: 'Active'} }
    });
  }),

  totalOpportunities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.opps.count();
  }),

  totalSwipes: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.userAction.count({
      where: { actionType: { in: ["LIKE", "UNLIKE", "SAVE", "UNSAVE", "CLICK"] } }
    });
  }),

  monthlyActiveUsers: adminProcedure
    .input(z.object({
      period: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90;
      const nowSGT = toAppTimezone(new Date());
      const since = subDays(startOfDay(nowSGT), days);
      
      const userActions = await ctx.db.userAction.findMany({
        where: { createdAt: { gte: since } },
        select: { userId: true, guestId: true }
      });

      // Handle guest-to-user mapping
      const guestToUserMap = new Map<string, string>();
      userActions.forEach(action => {
        if (action.guestId && action.userId) {
          guestToUserMap.set(action.guestId, action.userId);
        }
      });

      const uniqueIds = new Set<string>();
      userActions.forEach(action => {
        if (action.userId) {
          uniqueIds.add(`user_${action.userId}`);
        } else if (action.guestId) {
          const mappedUserId = guestToUserMap.get(action.guestId);
          if (mappedUserId) {
            uniqueIds.add(`user_${mappedUserId}`);
          } else {
            uniqueIds.add(`guest_${action.guestId}`);
          }
        }
      });

      return uniqueIds.size;
    }),

  newUsersOverTime: adminProcedure
    .input(z.object({
      period: z.enum(["30d", "90d", "6m", "1y"]).optional().default("90d"),
    }))
    .query(async ({ ctx, input }) => {
      const nowSGT = toAppTimezone(new Date());
      const until = startOfDay(nowSGT);
      let since: Date;

      switch (input.period) {
        case "30d":
          since = subDays(until, 30);
          break;
        case "90d":
          since = subDays(until, 90);
          break;
        case "6m":
          since = subMonths(until, 6);
          break;
        case "1y":
          since = subMonths(until, 12);
          break;
        default:
          since = subDays(until, 90);
      }

      const data = await ctx.db.user.findMany({
        where: { createdAt: { gte: since, lte: until } },
        select: { createdAt: true }
      });

      
      // Group by day in SGT and count
      const dailyData = data.reduce((acc, user) => {
        const dayKey = formatDateKey(user.createdAt);
        acc[dayKey] = (acc[dayKey] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);


      return createDateRange(since, until, dailyData);
    }),

  swipesOverTime: adminProcedure
    .input(z.object({
      period: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90;
      const nowSGT = toAppTimezone(new Date());
      const until = startOfDay(nowSGT);
      const since = subDays(until, days);

      const data = await ctx.db.userAction.findMany({
        where: {
          createdAt: { gte: since, lte: until },
        },
        select: { 
          createdAt: true,
          actionType: true
        }
      });

      const allActionTypes = ["LIKE", "UNLIKE", "SAVE", "UNSAVE", "CLICK"] as const;

      // Group by day in SGT and action type
      const dailyData = data.reduce((acc, action) => {
        const dayKey = formatDateKey(action.createdAt);
        acc[dayKey] ??= {};
        acc[dayKey][action.actionType] = (acc[dayKey][action.actionType] ?? 0) + 1;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      // Create date range with all action types
    const dateRange: ActionCounts[] = [];

let currentDate = startOfDayInAppTimezone(since);
const untilSGT = startOfDayInAppTimezone(until);

while (currentDate <= untilSGT) {
  const dayKey = formatDateKey(currentDate);
  const dayData = dailyData[dayKey] ?? {};

  const dateEntry: ActionCounts = {
    date: dayKey,
    ...Object.fromEntries(
      allActionTypes.map(actionType => [
        actionType,
        dayData[actionType] ?? 0,
      ])
    ) as Record<ActionType, number>,
  };

  dateRange.push(dateEntry);

  currentDate = startOfDayInAppTimezone(addDays(currentDate, 1));
}

      return dateRange;
    }),

  bestOpportunities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.oppMetrics.findMany({
      orderBy: { viewCount: "desc" },
      take: 5,
      include: { opportunity: true }
    });
  }),

  leastOpportunities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.oppMetrics.findMany({
      orderBy: { viewCount: "asc" },
      where: { viewCount: { gt: 0 } },
      take: 5,
      include: { opportunity: true }
    });
  }),

  popularZones: adminProcedure.query(async ({ ctx }) => {
    const zoneCounts = await ctx.db.oppZone.groupBy({
      by: ["zoneId"],
      _count: true,
      orderBy: { _count: { zoneId: "desc" } },
      take: 5
    });

    return ctx.db.zones.findMany({
      where: { id: { in: zoneCounts.map(z => z.zoneId) } }
    });
  }),

  leastPopularZones: adminProcedure.query(async ({ ctx }) => {
    const zoneCounts = await ctx.db.oppZone.groupBy({
      by: ["zoneId"],
      _count: true,
      orderBy: { _count: { zoneId: "asc" } },
      take: 5
    });

    return ctx.db.zones.findMany({
      where: { id: { in: zoneCounts.map(z => z.zoneId) } }
    });
  }),

  dailyActiveUsers: adminProcedure
    .input(z.object({
      period: z.enum(["7d", "30d", "90d", "6m", "1y"]).optional().default("30d"),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      aggregation: z.enum(["daily", "monthly"]).optional().default("daily"),
    }))
    .query(async ({ ctx, input }) => {
      const nowSGT = toAppTimezone(new Date());
      let since: Date;
      let until: Date = startOfDay(nowSGT);

      // If custom date range is provided
      if (input.startDate && input.endDate) {
        since = startOfDayInAppTimezone(input.startDate);
        until = startOfDayInAppTimezone(input.endDate);
      } else {
        // Use predefined periods
        switch (input.period) {
          case "7d":
            since = subDays(until, 7);
            break;
          case "30d":
            since = subDays(until, 30);
            break;
          case "90d":
            since = subDays(until, 90);
            break;
          case "6m":
            since = subMonths(until, 6);
            break;
          case "1y":
            since = subMonths(until, 12);
            break;
          default:
            since = subDays(until, 30);
        }
      }

      // Get all user actions in the date range
      const data = await ctx.db.userAction.findMany({
        where: { 
          createdAt: { 
            gte: since,
            lte: until 
          } 
        },
        select: {
          createdAt: true,
          userId: true,
          guestId: true
        }
      });

      // First, identify which guestIds are associated with userIds
      const guestToUserMap = new Map<string, string>();
      data.forEach(action => {
        if (action.guestId && action.userId) {
          guestToUserMap.set(action.guestId, action.userId);
        }
      });

      // Group by day or month based on aggregation (in SGT)
      const aggregatedData = data.reduce((acc, action) => {
        let timeKey: string;
        
        if (input.aggregation === "monthly") {
          timeKey = formatMonthKey(action.createdAt);
        } else {
          timeKey = formatDateKey(action.createdAt);
        }
        
        acc[timeKey] ??= {
          total: new Set<string>(),
          loggedIn: new Set<string>(),
          guest: new Set<string>()
        };
        
        // Determine the unique user identifier and type
        let uniqueUserId: string;
        let userType: 'loggedIn' | 'guest';
        
        if (action.userId) {
          uniqueUserId = `user_${action.userId}`;
          userType = 'loggedIn';
        } else if (action.guestId) {
          const mappedUserId = guestToUserMap.get(action.guestId);
          if (mappedUserId) {
            uniqueUserId = `user_${mappedUserId}`;
            userType = 'loggedIn';
          } else {
            uniqueUserId = `guest_${action.guestId}`;
            userType = 'guest';
          }
        } else {
          return acc;
        }
        
        // Add to total and appropriate category
        acc[timeKey]!.total.add(uniqueUserId);
        acc[timeKey]![userType].add(uniqueUserId);
        
        return acc;
      }, {} as Record<string, {
        total: Set<string>;
        loggedIn: Set<string>;
        guest: Set<string>;
      }>);

      // Create a complete date range with 0 counts for missing periods
      const dateRange: { date: string; total: number; loggedIn: number; guest: number }[] = [];
      
      if (input.aggregation === "monthly") {
        // Generate monthly range in SGT
        const currentMonth = new Date(since.getFullYear(), since.getMonth(), 1);
        const endMonth = new Date(until.getFullYear(), until.getMonth(), 1);
        
        while (currentMonth <= endMonth) {
          const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
          const counts = aggregatedData[monthKey];
          
          dateRange.push({
            date: monthKey,
            total: counts?.total.size ?? 0,
            loggedIn: counts?.loggedIn.size ?? 0,
            guest: counts?.guest.size ?? 0
          });
          
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      } else {
        // Generate daily range in SGT
      let currentDate = startOfDayInAppTimezone(since);
const untilSGT = startOfDayInAppTimezone(until);

while (currentDate <= untilSGT) {
  const dayKey = formatDateKey(currentDate);
  const counts = aggregatedData[dayKey];

  dateRange.push({
    date: dayKey,
    total: counts?.total.size ?? 0,
    loggedIn: counts?.loggedIn.size ?? 0,
    guest: counts?.guest.size ?? 0
  });

  // ✅ increment in SGT
  currentDate = startOfDayInAppTimezone(addDays(currentDate, 1));
}
      }
      
      return dateRange;
    }),


    // Product Metrics

     stickinessWAUMAU: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sevenDaysAgo = subDays(new Date(), 7);

    // Get MAU (Monthly Active Users)
    const mauActions = await ctx.db.userAction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { userId: true, guestId: true }
    });

    // Get WAU (Weekly Active Users)  
    const wauActions = await ctx.db.userAction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true, guestId: true }
    });

    // Helper function to get unique users
    const getUniqueUsers = (actions: typeof mauActions) => {
      const guestToUserMap = new Map<string, string>();
      actions.forEach(action => {
        if (action.guestId && action.userId) {
          guestToUserMap.set(action.guestId, action.userId);
        }
      });

      const uniqueIds = new Set<string>();
      actions.forEach(action => {
        if (action.userId) {
          uniqueIds.add(`user_${action.userId}`);
        } else if (action.guestId) {
          const mappedUserId = guestToUserMap.get(action.guestId);
          if (mappedUserId) {
            uniqueIds.add(`user_${mappedUserId}`);
          } else {
            uniqueIds.add(`guest_${action.guestId}`);
          }
        }
      });
      return uniqueIds.size;
    };

    const mau = getUniqueUsers(mauActions);
    const wau = getUniqueUsers(wauActions);
    const ratio = mau > 0 ? (wau / mau) * 100 : 0;

    return {
      wau,
      mau,
      ratio,
      benchmark: ratio >= 50 ? "Great" : ratio >= 40 ? "Good" : ratio >= 25 ? "OK" : "Below OK"
    };
  }),

  // L-ness curve (L5+ performance) - Users active 5+ days in a week
  lnessCurve: adminProcedure
    .input(z.object({
      weeks: z.number().optional().default(4)
    }))
    .query(async ({ ctx, input }) => {
      const weeksAgo = subWeeks(new Date(), input.weeks);
      
      const actions = await ctx.db.userAction.findMany({
        where: { createdAt: { gte: weeksAgo } },
        select: { userId: true, guestId: true, createdAt: true }
      });

      // Group by user and week
      const userWeeklyActivity = new Map<string, Map<string, Set<string>>>();
      
      actions.forEach(action => {
        const userId = action.userId ? `user_${action.userId}` : `guest_${action.guestId}`;
        if (!userId) return;

        const weekKey = startOfWeek(action.createdAt).toISOString();
        const dayKey = startOfDay(action.createdAt).toISOString();

        if (!userWeeklyActivity.has(userId)) {
          userWeeklyActivity.set(userId, new Map());
        }
        if (!userWeeklyActivity.get(userId)!.has(weekKey)) {
          userWeeklyActivity.get(userId)!.set(weekKey, new Set());
        }
        userWeeklyActivity.get(userId)!.get(weekKey)!.add(dayKey);
      });

      // Calculate L5+ users (active 5+ days per week)
      let totalUserWeeks = 0;
      let l5PlusUserWeeks = 0;

      userWeeklyActivity.forEach(userWeeks => {
        userWeeks.forEach(activeDays => {
          totalUserWeeks++;
          if (activeDays.size >= 5) {
            l5PlusUserWeeks++;
          }
        });
      });

      const l5PlusPercentage = totalUserWeeks > 0 ? (l5PlusUserWeeks / totalUserWeeks) * 100 : 0;

      return {
        l5PlusPercentage,
        totalUserWeeks,
        l5PlusUserWeeks,
        benchmark: l5PlusPercentage >= 50 ? "Great" : l5PlusPercentage >= 40 ? "Good" : l5PlusPercentage >= 30 ? "OK" : "Below OK"
      };
    }),

  // 2. VIRALITY METRICS
  // kFactor: adminProcedure.query(async ({ ctx }) => {
  //   // You'll need to implement invite tracking in your schema
  //   // This is a placeholder showing the structure
    
  //   // Assuming you have an invites table with fields:
  //   // - inviterId (who sent the invite)
  //   // - inviteeId (who received it, nullable until they sign up)
  //   // - converted (boolean, whether they signed up)
    
  //   // const invites = await ctx.db.invite.findMany({
  //   //   select: { inviterId: true, converted: true }
  //   // });

  //   // const invitesByUser = invites.reduce((acc, invite) => {
  //   //   acc[invite.inviterId] = (acc[invite.inviterId] || 0) + 1;
  //   //   return acc;
  //   // }, {} as Record<string, number>);

  //   // const conversions = invites.filter(i => i.converted).length;
  //   // const totalInvites = invites.length;

  //   // const avgInvitesPerUser = Object.keys(invitesByUser).length > 0 
  //   //   ? Object.values(invitesByUser).reduce((a, b) => a + b, 0) / Object.keys(invitesByUser).length 
  //   //   : 0;
    
  //   // const conversionRate = totalInvites > 0 ? conversions / totalInvites : 0;
  //   // const kFactor = avgInvitesPerUser * conversionRate;

  //   return {
  //     kFactor: 0, // Placeholder until you implement invite tracking
  //     avgInvitesPerUser: 0,
  //     conversionRate: 0,
  //     totalInvites: 0,
  //     conversions: 0,
  //     message: "Invite tracking not implemented yet"
  //   };
  // }),

  // 3. IMPACT METRICS
  interestIdentificationRate: adminProcedure.query(async ({ ctx }) => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    
    // Get users created in last 6 months
    const newUsers = await ctx.db.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { id: true }
    });

    // Check which users have identified interests (you'll need to adjust based on your schema)
    // Assuming you track user interests/preferences in some way
    const usersWithInterests = await ctx.db.userAction.groupBy({
      by: ['userId'],
      where: {
        userId: { in: newUsers.map(u => u.id) },
        actionType: 'LIKE'
      },
      _count: { userId: true }
    });

    // Users with at least 3 likes are considered to have "identified interests"
    const usersWithIdentifiedInterests = usersWithInterests.filter(u => u._count.userId >= 3);
    
    const rate = newUsers.length > 0 ? (usersWithIdentifiedInterests.length / newUsers.length) * 100 : 0;

    return {
      totalNewUsers: newUsers.length,
      usersWithInterests: usersWithIdentifiedInterests.length,
      rate,
      benchmark: rate >= 70 ? "Great" : "Below Target"
    };
  }),

  opportunityEngagementMetrics: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const metrics = await ctx.db.oppMetrics.findMany({
      where: {
        updatedAt: { gte: thirtyDaysAgo }
      },
      select: {
        viewCount: true,
        likeCount: true,
        clickCount: true
      }
    });

    const totalViews = metrics.reduce((sum, m) => sum + m.viewCount, 0);
    const totalLikes = metrics.reduce((sum, m) => sum + m.likeCount, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clickCount, 0);

    const avgOpportunityViews = metrics.length > 0 ? totalViews / metrics.length : 0;
    const likesViewsRatio = totalViews > 0 ? totalLikes / totalViews : 0;
    const clicksViewsRatio = totalViews > 0 ? totalClicks / totalViews : 0;

    return {
      avgOpportunityViews,
      likesViewsRatio,
      clicksViewsRatio,
      totalViews,
      totalLikes,
      totalClicks
    };
  }),

  // 4. GROWTH METRICS
  userGrowthRate: adminProcedure
    .input(z.object({
      period: z.enum(["monthly", "weekly", "daily"]).optional().default("monthly")
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let previousPeriodStart: Date;
      let currentPeriodStart: Date;

      switch (input.period) {
        case "monthly":
          currentPeriodStart = subMonths(now, 1);
          previousPeriodStart = subMonths(now, 2);
          break;
        case "weekly":
          currentPeriodStart = subWeeks(now, 1);
          previousPeriodStart = subWeeks(now, 2);
          break;
        case "daily":
          currentPeriodStart = subDays(now, 1);
          previousPeriodStart = subDays(now, 2);
          break;
      }

      const currentPeriodUsers = await ctx.db.user.count({
        where: { createdAt: { gte: currentPeriodStart, lt: now } }
      });

      const previousPeriodUsers = await ctx.db.user.count({
        where: { createdAt: { gte: previousPeriodStart, lt: currentPeriodStart } }
      });

      const growthRate = previousPeriodUsers > 0 
        ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
        : currentPeriodUsers > 0 ? 100 : 0;

      return {
        currentPeriodUsers,
        previousPeriodUsers,
        growthRate,
        benchmark: growthRate >= 50 ? "Great" : growthRate >= 35 ? "Good" : growthRate >= 20 ? "OK" : "Below OK"
      };
    }),

  // 5. RETENTION METRICS
  retentionMetrics: adminProcedure
    .input(z.object({
      cohortDate: z.date().optional().default(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    }))
    .query(async ({ ctx, input }) => {
      const cohortStart = startOfDay(input.cohortDate);
      const cohortEnd = addDays(cohortStart, 1);

      // Get users who signed up on the cohort date
      const cohortUsers = await ctx.db.user.findMany({
        where: {
          createdAt: { gte: cohortStart, lt: cohortEnd }
        },
        select: { id: true }
      });

      if (cohortUsers.length === 0) {
        return {
          d1: 0, d7: 0, d30: 0,
          w1: 0, w4: 0,
          cohortSize: 0,
          message: "No users in this cohort"
        };
      }

      const cohortUserIds = cohortUsers.map(u => u.id);

      // Helper function to check retention on specific days
      const checkRetention = async (daysAfter: number) => {
        const checkDate = addDays(cohortStart, daysAfter);
        const nextDay = addDays(checkDate, 1);
        
        const activeUsers = await ctx.db.userAction.groupBy({
          by: ['userId'],
          where: {
            userId: { in: cohortUserIds },
            createdAt: { gte: checkDate, lt: nextDay }
          }
        });

        return (activeUsers.length / cohortUsers.length) * 100;
      };

      // Helper function to check weekly retention
      const checkWeeklyRetention = async (weeksAfter: number) => {
        const checkWeekStart = addWeeks(cohortStart, weeksAfter);
        const checkWeekEnd = addWeeks(checkWeekStart, 1);
        
        const activeUsers = await ctx.db.userAction.groupBy({
          by: ['userId'],
          where: {
            userId: { in: cohortUserIds },
            createdAt: { gte: checkWeekStart, lt: checkWeekEnd }
          }
        });

        return (activeUsers.length / cohortUsers.length) * 100;
      };

      const [d1, d7, d30, w1, w4] = await Promise.all([
        checkRetention(1),
        checkRetention(7),
        checkRetention(30),
        checkWeeklyRetention(1),
        checkWeeklyRetention(4)
      ]);

      return {
        d1, d7, d30, w1, w4,
        cohortSize: cohortUsers.length,
        benchmarks: {
          d1: d1 >= 70 ? "Great" : d1 >= 60 ? "Good" : d1 >= 50 ? "OK" : "Below OK",
          d7: d7 >= 50 ? "Great" : d7 >= 40 ? "Good" : d7 >= 35 ? "OK" : "Below OK",
          d30: d30 >= 30 ? "Great" : d30 >= 25 ? "Good" : d30 >= 20 ? "OK" : "Below OK",
          w1: w1 >= 75 ? "Great" : w1 >= 55 ? "Good" : w1 >= 40 ? "OK" : "Below OK",
          w4: w4 >= 50 ? "Great" : w4 >= 30 ? "Good" : w4 >= 20 ? "OK" : "Below OK"
        }
      };
    }),

  // 6. USER FLOW OPTIMIZATION
  activationMetrics: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const newUsers = await ctx.db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, createdAt: true }
    });

    // Check which users performed their first action within 24 hours
    const activatedUsers = await Promise.all(
      newUsers.map(async (user) => {
        const dayAfterSignup = addDays(user.createdAt, 1);
        const firstAction = await ctx.db.userAction.findFirst({
          where: {
            userId: user.id,
            createdAt: { gte: user.createdAt, lt: dayAfterSignup }
          }
        });
        return firstAction ? user.id : null;
      })
    );

    const activatedCount = activatedUsers.filter(Boolean).length;
    const activationRate = newUsers.length > 0 ? (activatedCount / newUsers.length) * 100 : 0;

    return {
      totalNewUsers: newUsers.length,
      activatedUsers: activatedCount,
      activationRate
    };
  }),

  // 7. LOADING SPEED (You'll need to implement client-side tracking for this)
  loadingSpeedMetrics: adminProcedure.query(async ({ ctx }) => {
    // This would require client-side performance tracking
    // You'd need to send performance metrics from your frontend
    return {
      message: "Loading speed metrics require client-side implementation",
      avgLoadTime: 0,
      fastLoads: 0, // <1-2s
      slowLoads: 0  // >2s
    };
  }),

  // 8. OPPORTUNITY METRICS
  // weeklyOpportunityMetrics: adminProcedure.query(async ({ ctx }) => {
  //   const oneWeekAgo = subWeeks(new Date(), 1);
    
  //   const opportunitiesPerWeek = await ctx.db.opps.count({
  //     where: { created_at: { gte: oneWeekAgo } }
  //   });

  //   const totalOpportunities = await ctx.db.opps.count();
  //   const avgOpportunitiesPerWeek = totalOpportunities / 
  //     Math.max(1, Math.ceil((Date.now() - (await ctx.db.opps.findFirst({ 
  //       orderBy: { created_at: 'asc' } 
  //     }))?.created_at.getTime() || Date.now()) / (7 * 24 * 60 * 60 * 1000)));

  //   return {
  //     opportunitiesThisWeek: opportunitiesPerWeek,
  //     avgOpportunitiesPerWeek,
  //     totalOpportunities
  //   };
  // }),

  // Combined dashboard metrics
  dashboardOverview: adminProcedure.query(async ({ ctx }) => {
    const [
      stickiness,
      retention,
      growth,
      engagement,
      activation
    ] = await Promise.all([
      ctx.db.userAction.findMany({ 
        where: { createdAt: { gte: subDays(new Date(), 30) } },
        select: { userId: true, guestId: true, createdAt: true }
      }).then(actions => {
        // Calculate basic stickiness metrics
        const wauActions = actions.filter(a => a.createdAt >= subDays(new Date(), 7));
        return {
          mau: new Set(actions.map(a => a.userId ?? a.guestId)).size,
          wau: new Set(wauActions.map(a => a.userId ?? a.guestId)).size
        };
      }),
      // Simplified retention for overview
      ctx.db.user.count({ where: { createdAt: { gte: subDays(new Date(), 30) } } }),
      // Growth rate
      ctx.db.user.count({ where: { createdAt: { gte: subDays(new Date(), 7) } } }),
      // Total engagement
      ctx.db.userAction.count({ where: { createdAt: { gte: subDays(new Date(), 7) } } }),
      // Activation rate
      ctx.db.user.count({ where: { createdAt: { gte: subDays(new Date(), 7) } } })
    ]);

    return {
      stickiness: stickiness.mau > 0 ? (stickiness.wau / stickiness.mau) * 100 : 0,
      newUsersThisMonth: retention,
      newUsersThisWeek: growth,
      totalEngagementThisWeek: engagement,
      recentSignups: activation
    };
  })



});