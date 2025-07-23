import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { subDays, subMonths, startOfDay, addDays } from "date-fns";

const createDateRange = (since: Date, until: Date, dailyData: Record<string, number>) => {
  const dateRange: { date: string; count: number }[] = [];
  const currentDate = new Date(since);
  
  while (currentDate <= until) {
    const dayKey = startOfDay(currentDate).toISOString();
    
    dateRange.push({
      date: dayKey,
      count: dailyData[dayKey] ?? 0
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateRange;
};

export const adminRouter = createTRPCRouter({
 totalUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.count();
  }),

  activeOpportunities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.opps.count({
      where: { status: { not: "null" } }
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
      const since = subDays(new Date(), days);
      
      const userActions = await ctx.db.userAction.findMany({
        where: { createdAt: { gte: since } },
        select: { userId: true, guestId: true }
      });

      // Handle guest-to-user mapping (same logic as dailyActiveUsers)
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
      let since: Date;
      const until = new Date();

      switch (input.period) {
        case "30d":
          since = subDays(new Date(), 30);
          break;
        case "90d":
          since = subDays(new Date(), 90);
          break;
        case "6m":
          since = subMonths(new Date(), 6);
          break;
        case "1y":
          since = subMonths(new Date(), 12);
          break;
        default:
          since = subDays(new Date(), 90);
      }

      const data = await ctx.db.user.findMany({
        where: { createdAt: { gte: since, lte: until } },
        select: { createdAt: true }
      });

      // Group by day and count
      const dailyData = data.reduce((acc, user) => {
        const dayKey = startOfDay(user.createdAt).toISOString();
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
    const since = subDays(new Date(), days);
    const until = new Date();

    // Get all user actions without filtering by type
    const data = await ctx.db.userAction.findMany({
      where: {
        createdAt: { gte: since, lte: until },
      },
      select: { 
        createdAt: true,
        actionType: true
      }
    });

    // All possible action types
    const allActionTypes = ["LIKE", "UNLIKE", "SAVE", "UNSAVE", "CLICK"] as const;

    // Group by day and action type
    const dailyData = data.reduce((acc, action) => {
      const dayKey = startOfDay(action.createdAt).toISOString();
      acc[dayKey] ??= {};
      acc[dayKey][action.actionType] = (acc[dayKey][action.actionType] ?? 0) + 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Create date range with all action types
    const dateRange: Array<{ date: string } & Record<typeof allActionTypes[number], number>> = [];
    let currentDate = startOfDay(since);
    
    while (currentDate <= until) {
      const dayKey = currentDate.toISOString();
      const dayData = dailyData[dayKey] ?? {};
      
      const dateEntry = {
        date: dayKey,
        ...Object.fromEntries(
          allActionTypes.map(actionType => [actionType, dayData[actionType] ?? 0])
        )
      } as { date: string } & Record<typeof allActionTypes[number], number>;
      
      dateRange.push(dateEntry);
      currentDate = addDays(currentDate, 1);
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
    let since: Date;
    let until: Date = new Date();

    // If custom date range is provided
    if (input.startDate && input.endDate) {
      since = startOfDay(input.startDate);
      until = startOfDay(input.endDate);
    } else {
      // Use predefined periods
      switch (input.period) {
        case "7d":
          since = subDays(new Date(), 7);
          break;
        case "30d":
          since = subDays(new Date(), 30);
          break;
        case "90d":
          since = subDays(new Date(), 90);
          break;
        case "6m":
          since = subMonths(new Date(), 6);
          break;
        case "1y":
          since = subMonths(new Date(), 12);
          break;
        default:
          since = subDays(new Date(), 30);
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

    // Group by day or month based on aggregation
    const aggregatedData = data.reduce((acc, action) => {
      let timeKey: string;
      
      if (input.aggregation === "monthly") {
        // Group by month (YYYY-MM format)
        const date = new Date(action.createdAt);
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Group by day
        timeKey = startOfDay(action.createdAt).toISOString();
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
        // If there's a userId, it's a logged-in user
        uniqueUserId = `user_${action.userId}`;
        userType = 'loggedIn';
      } else if (action.guestId) {
        // If there's a guestId, check if it's mapped to a userId
        const mappedUserId = guestToUserMap.get(action.guestId);
        if (mappedUserId) {
          // This guest later became a logged-in user
          uniqueUserId = `user_${mappedUserId}`;
          userType = 'loggedIn';
        } else {
          // This is a pure guest user
          uniqueUserId = `guest_${action.guestId}`;
          userType = 'guest';
        }
      } else {
        // Skip if neither userId nor guestId
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
      // Generate monthly range
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
        
        // Move to next month
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    } else {
      // Generate daily range (existing logic)
      const currentDate = new Date(since);
      
      while (currentDate <= until) {
        const dayKey = startOfDay(currentDate).toISOString();
        const counts = aggregatedData[dayKey];
        
        dateRange.push({
          date: dayKey,
          total: counts?.total.size ?? 0,
          loggedIn: counts?.loggedIn.size ?? 0,
          guest: counts?.guest.size ?? 0
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return dateRange;
  }),
});