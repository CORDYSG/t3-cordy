import { parseISO, subDays, isAfter, isBefore, startOfDay } from "date-fns";

type ActiveUserEntry = {
  date: string; // "2024-07-21"
  total: number;
};

type GrowthRates = {
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
};

export function getActiveUserGrowthRates(data: ActiveUserEntry[]): GrowthRates {
  const now = startOfDay(new Date());

  const filterDataBetween = (from: Date, to: Date) =>
    data.filter(entry => {
      const entryDate = parseISO(entry.date);
      const entryDay = startOfDay(entryDate);
      // Include entries where: from <= entryDate < to
      return (entryDay >= from) && (entryDay < to);
    });

  const totalUsers = (entries: ActiveUserEntry[]) =>
    entries.reduce((sum, entry) => sum + entry.total, 0);

  const calculateGrowth = (current: number, previous: number): number | null => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  // Daily: yesterday vs day before yesterday
  const yesterday = subDays(now, 1);
  const dayBefore = subDays(now, 2);
  const twoDaysAgo = subDays(now, 3);
  
  const dailyCurrent = totalUsers(filterDataBetween(dayBefore, yesterday));
  const dailyPrevious = totalUsers(filterDataBetween(twoDaysAgo, dayBefore));
  const daily = calculateGrowth(dailyCurrent, dailyPrevious);

  // Weekly: last 7 days vs previous 7 days
  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);
  
  const weeklyCurrent = totalUsers(filterDataBetween(sevenDaysAgo, now));
  const weeklyPrevious = totalUsers(filterDataBetween(fourteenDaysAgo, sevenDaysAgo));
  const weekly = calculateGrowth(weeklyCurrent, weeklyPrevious);

  // Monthly: last 30 days vs previous 30 days
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);
  
  const monthlyCurrent = totalUsers(filterDataBetween(thirtyDaysAgo, now));
  const monthlyPrevious = totalUsers(filterDataBetween(sixtyDaysAgo, thirtyDaysAgo));
  const monthly = calculateGrowth(monthlyCurrent, monthlyPrevious);

  return {
    daily,
    weekly,
    monthly,
  };
}