"use client";

import { api } from "@/trpc/react";

import { useEffect, useState } from "react";

import TimeSeriesGraph from "@/app/_components/AdminCharts/TimeSeriesGraph";
import DailyActiveUsersChart from "@/app/_components/AdminCharts/DailyActiveUsersChart";
import SwipesChart from "@/app/_components/AdminCharts/SwipesChart";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getFormattedDate } from "@/lib/utils";
import { getActiveUserGrowthRates } from "@/lib/fnc/metrics-calc";
import { Skeleton } from "@/components/ui/skeleton";

const StatBox = ({
  label,
  value,
  isLoading = false,
}: {
  label: string;
  value: number | string;
  isLoading?: boolean;
}) => {
  return (
    <div className="shadow-brand wrap-break-words rounded-md border-2 bg-white p-4 break-words hyphens-auto">
      {" "}
      <h2 className="text-sm font-medium md:text-lg">{label}</h2>
      {isLoading ? (
        <Skeleton className="h-[20px] w-[100px] rounded-md" />
      ) : (
        <>
          <p className="text-md font-semibold md:text-xl">{value}</p>
        </>
      )}
    </div>
  );
};

const AdminPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle session state changes
  useEffect(() => {
    if (status === "unauthenticated" || session?.user?.role != "CORDY") {
      router.push("/api/auth/signin");
      return;
    }
  }, [status, session?.user?.id, router]);

  const [dailyActiveUsersPeriod, setDailyActiveUsersPeriod] = useState("30d");
  const [monthlyActivePeriod, setMonthlyActivePeriod] = useState("30d");
  const [newUsersPeriod, setNewUsersPeriod] = useState("90d");
  const [swipesPeriod, setSwipesPeriod] = useState("30d");

  const [dailyActiveUsersAggregation, setDailyActiveUsersAggregation] =
    useState<"daily" | "monthly">("daily");

  const totalUsers = api.admin.totalUsers.useQuery();
  const totalOpportunities = api.admin.totalOpportunities.useQuery();
  const activeOpportunities = api.admin.activeOpportunities.useQuery();
  const totalSwipes = api.admin.totalSwipes.useQuery();

  const monthlyActive = api.admin.monthlyActiveUsers.useQuery({
    period: monthlyActivePeriod as "7d" | "30d" | "90d",
  });

  const {
    data: dailyActiveUsers,
    isLoading: dailyActiveUsersIsLoading,
    error: dailyActiveUsersIsError,
  } = api.admin.dailyActiveUsers.useQuery({
    period: dailyActiveUsersPeriod as "7d" | "30d" | "90d" | "6m" | "1y",
    aggregation: dailyActiveUsersAggregation,
  });
  const {
    data: newUsersOverTime,
    isLoading: newUsersOverTimeIsLoading,
    error: newUsersOverTimeIsError,
  } = api.admin.newUsersOverTime.useQuery({
    period: newUsersPeriod as "30d" | "90d" | "6m" | "1y",
  });

  const {
    data: swipesOverTime,
    isLoading: swipesOverTimeIsLoading,
    error: swipesOverTimeIsError,
  } = api.admin.swipesOverTime.useQuery({
    period: swipesPeriod as "7d" | "30d" | "90d",
  });

  const growthRates = getActiveUserGrowthRates(dailyActiveUsers ?? []);
  // TRPC query to fetch the data

  const getTimeGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-muted-foreground">{getFormattedDate()} (SGT)</p>
        <h1 className="text-3xl font-semibold">
          {getTimeGreeting()}, {session?.user?.name ?? "CORDY Admin"}
        </h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatBox
          label="Total Users (Log in)"
          value={totalUsers.data ?? 0}
          isLoading={totalUsers.isLoading}
        />
        <StatBox
          label={`Active Users (${monthlyActivePeriod})`}
          value={monthlyActive.data ?? 0}
          isLoading={monthlyActive.isLoading}
        />
        <StatBox
          label="Total Opportunities"
          value={totalOpportunities.data ?? 0}
          isLoading={totalOpportunities.isLoading}
        />

        <StatBox
          label="Active Opportunities"
          isLoading={activeOpportunities.isLoading}
          value={activeOpportunities.data ?? 0}
        />
        <StatBox
          label="Total Swipes"
          isLoading={totalSwipes.isLoading}
          value={totalSwipes.data ?? 0}
        />
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <div className="shadow-brand border-l-primary grid grid-cols-1 gap-4 rounded-md border-2 border-l-8 bg-white p-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <DailyActiveUsersChart
              isLoading={dailyActiveUsersIsLoading}
              tooltipText="Unique users that have performed an action."
              title="Daily Active Users"
              data={dailyActiveUsers}
              period={dailyActiveUsersPeriod}
              aggregation={dailyActiveUsersAggregation}
              onPeriodChange={setDailyActiveUsersPeriod}
              onAggregationChange={setDailyActiveUsersAggregation}
            />
          </div>

          <div className="flex gap-4 lg:block lg:space-y-4">
            <div className="flex-1">
              <StatBox
                label="Daily (DGR)"
                value={`${growthRates.daily?.toFixed(1) ?? 0}%`}
              />
            </div>
            <div className="flex-1">
              <StatBox
                label="Weekly (WGR)"
                value={`${growthRates.weekly?.toFixed(1) ?? 0}%`}
              />
            </div>
            <div className="flex-1">
              <StatBox
                label="Monthly (MGR)"
                value={`${growthRates.monthly?.toFixed(1) ?? 0}%`}
              />
            </div>
          </div>
        </div>
        <div className="w-full flex-col gap-4 space-y-4 lg:flex">
          <div className="flex-1">
            <TimeSeriesGraph
              title="New Users Over Time"
              data={newUsersOverTime}
              isLoading={newUsersOverTimeIsLoading}
              period={newUsersPeriod}
              onPeriodChange={setNewUsersPeriod}
              periodOptions={[
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 90 days" },
                { value: "6m", label: "Last 6 months" },
                { value: "1y", label: "Last 1 year" },
              ]}
            />
          </div>
          <div className="flex-1">
            <SwipesChart
              title="User Actions Over Time"
              data={swipesOverTime}
              period={swipesPeriod}
              isLoading={swipesOverTimeIsLoading}
              onPeriodChange={setSwipesPeriod}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
