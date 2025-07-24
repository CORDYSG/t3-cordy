import { parseISO, subDays, startOfDay, addDays, format } from "date-fns";
import {  toZonedTime } from "date-fns-tz";

type ActiveUserEntry = {
  date: string; // "2024-07-21"
  total: number;
};

type GrowthRates = {
  daily: Growth;
  weekly: Growth;
  monthly: Growth;
};

type Growth = {
  percentage: number;
  numerical: number;
};

export function getActiveUserGrowthRates(data: ActiveUserEntry[]): GrowthRates {
  const SINGAPORE_TZ = 'Asia/Singapore';
  
  // Convert current time to Singapore timezone
  const nowSGT = toZonedTime(new Date(), SINGAPORE_TZ);
  const nowSGTStart = startOfDay(nowSGT);



  // Helper function to convert date string to Singapore timezone and get start of day
  const parseToSGT = (dateString: string): Date => {
    const utcDate = parseISO(dateString);
    const sgtDate = toZonedTime(utcDate, SINGAPORE_TZ);
    return startOfDay(sgtDate);
  };

  const filterDataBetween = (from: Date, to: Date) =>
    data.filter(entry => {
      const entryDateSGT = parseToSGT(entry.date);
      // Include entries where: from <= entryDate < to
      return (entryDateSGT >= from) && (entryDateSGT < to);
    });

  const totalUsers = (entries: ActiveUserEntry[]) =>
    entries.reduce((sum, entry) => sum + entry.total, 0);

  const calculateGrowth = (current: number, previous: number): Growth => {
    if (previous === 0) return { 
      percentage: 0,
      numerical: 0
    };
    return { 
      percentage: ((current - previous) / previous) * 100, 
      numerical: current - previous
    };
  };

  // Daily: latest day vs previous day (based on SGT)
  const latestDateSGT = new Date(Math.max(...data.map(d => parseToSGT(d.date).getTime())));
  const previousDay = subDays(latestDateSGT, 1);
  const twoDaysBack = subDays(latestDateSGT, 2);

  const dailyCurrent = totalUsers(filterDataBetween(latestDateSGT, addDays(latestDateSGT, 1)));
  const dailyPrevious = totalUsers(filterDataBetween(previousDay, addDays(previousDay, 1)));
  const dailyGrowth = calculateGrowth(dailyCurrent, dailyPrevious);

  // Weekly: last 7 days vs previous 7 days (SGT)
  const sevenDaysAgo = subDays(nowSGTStart, 7);
  const fourteenDaysAgo = subDays(nowSGTStart, 14);
  
  const weeklyCurrent = totalUsers(filterDataBetween(sevenDaysAgo, nowSGTStart));
  const weeklyPrevious = totalUsers(filterDataBetween(fourteenDaysAgo, sevenDaysAgo));
  const weeklyGrowth = calculateGrowth(weeklyCurrent, weeklyPrevious);

  // Monthly: last 30 days vs previous 30 days (SGT)
  const thirtyDaysAgo = subDays(nowSGTStart, 30);
  const sixtyDaysAgo = subDays(nowSGTStart, 60);
  
  const monthlyCurrent = totalUsers(filterDataBetween(thirtyDaysAgo, nowSGTStart));
  const monthlyPrevious = totalUsers(filterDataBetween(sixtyDaysAgo, thirtyDaysAgo));
  const monthlyGrowth = calculateGrowth(monthlyCurrent, monthlyPrevious);

  return {
    daily: {
      percentage: dailyGrowth.percentage,
      numerical: dailyGrowth.numerical,
    },
    weekly: {
      percentage: weeklyGrowth.percentage,
      numerical: weeklyGrowth.numerical
    },
    monthly: {
      percentage: monthlyGrowth.percentage,
      numerical: monthlyGrowth.numerical,
    },
  };
}