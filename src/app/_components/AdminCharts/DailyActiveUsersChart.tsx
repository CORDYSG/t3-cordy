/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable  @typescript-eslint/no-unsafe-return*/

import { formatSGT } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { InfoIcon } from "lucide-react";
import {
  Tooltip as RadixToolTip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DailyActiveUsersChart = ({
  title,
  data,
  period,
  aggregation = "daily",
  onPeriodChange,
  onAggregationChange,
  isLoading,
  tooltipText,
}: {
  title: string;
  data?: { date: string; total: number; loggedIn: number; guest: number }[];
  period: string;
  tooltipText?: string;
  aggregation?: "daily" | "monthly";
  onPeriodChange: (period: string) => void;
  onAggregationChange?: (aggregation: "daily" | "monthly") => void;
  isLoading: boolean;
}) => {
  // Format date based on aggregation type
  const formatDate = (dateStr: string) => {
    if (aggregation === "monthly") {
      // dateStr is in format "YYYY-MM"
      const [year, month] = dateStr.split("-");
      const date = new Date(parseInt(year!), parseInt(month!) - 1);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } else {
      // Use existing formatSGT for daily
      return formatSGT(dateStr);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="">
        <h2 className="text-lg font-medium">{title}</h2>
        <Skeleton className="h-[250px] w-full rounded-md" />
        <Skeleton className="h-[20px] w-[100px] rounded-md" />
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-4 items-center justify-between lg:flex">
        <div className="flex gap-2">
          {" "}
          <h2 className="text-lg font-medium">{title}</h2>
          {tooltipText && (
            <RadixToolTip>
              <TooltipTrigger>
                <InfoIcon size={16} className="opacity-40" />
              </TooltipTrigger>
              <TooltipContent>{tooltipText}</TooltipContent>
            </RadixToolTip>
          )}
        </div>

        <div className="flex gap-2">
          {/* Aggregation Toggle */}
          {onAggregationChange && (
            <select
              value={aggregation}
              onChange={(e) =>
                onAggregationChange(e.target.value as "daily" | "monthly")
              }
              className="rounded border px-3 py-1 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          )}

          {/* Period Selection */}
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="rounded border px-3 py-1 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last 1 year</option>
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data?.map((d) => ({ ...d, date: formatDate(d.date) }))}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={aggregation === "monthly" ? -45 : 0}
            textAnchor={aggregation === "monthly" ? "end" : "middle"}
            height={aggregation === "monthly" ? 60 : 30}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(label) =>
              `${aggregation === "monthly" ? "Month" : "Date"}: ${label}`
            }
            content={({ active, payload, label }) => {
              if (active && payload?.length) {
                const total = payload.reduce(
                  (sum, entry) => sum + (entry.value ?? 0),
                  0,
                );
                return (
                  <div className="rounded border bg-white p-3 shadow-lg">
                    <p className="font-medium">{`${aggregation === "monthly" ? "Month" : "Date"}: ${label}`}</p>
                    <p className="text-primary">{`Logged In: ${payload.find((p) => p.dataKey === "loggedIn")?.value ?? 0}`}</p>
                    <p className="text-accent-green">{`Guest: ${payload.find((p) => p.dataKey === "guest")?.value ?? 0}`}</p>
                    <p className="mt-1 border-t pt-1 font-semibold">{`Total: ${total}`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            formatter={(value) =>
              value === "loggedIn"
                ? "Logged In"
                : value === "guest"
                  ? "Guest"
                  : "Total"
            }
          />
          <Bar dataKey="loggedIn" stackId="a" fill="#e84855" name="loggedIn" />
          <Bar dataKey="guest" stackId="a" fill="#06d6a0" name="guest" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyActiveUsersChart;
