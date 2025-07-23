/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable  @typescript-eslint/no-unsafe-assignment */
/* eslint-disable  @typescript-eslint/no-unsafe-return */

import { Skeleton } from "@/components/ui/skeleton";
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

const SwipesChart = ({
  title,
  data,
  period,
  onPeriodChange,
  isLoading,
}: {
  title: string;
  data?: {
    date: string;
    LIKE?: number;
    UNLIKE?: number;
    SAVE?: number;
    UNSAVE?: number;
    CLICK?: number;
  }[];
  period: string;
  onPeriodChange: (period: string) => void;
  isLoading: boolean;
}) => {
  // All action types to display
  const allActionTypes = ["LIKE", "UNLIKE", "SAVE", "UNSAVE", "CLICK"];

  // Color mapping for different action types
  const actionColors = {
    LIKE: "#ef476f", // green
    UNLIKE: "#fb8500", // red
    SAVE: "#ff70a6", // blue
    UNSAVE: "#30a8cd", // amber
    CLICK: "#06d6a0", // purple
  };

  if (isLoading || !data) {
    return (
      <div className="shadow-brand space-y-4 rounded-md border-2 bg-white p-4">
        <h2 className="text-lg font-medium">{title}</h2>
        <Skeleton className="h-[250px] w-full rounded-md" />
        <Skeleton className="h-[20px] w-[100px] rounded-md" />
      </div>
    );
  }

  return (
    <div className="shadow-brand rounded-md border-2 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="rounded border px-3 py-1 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data.map((d) => ({ ...d, date: formatSGT(d.date) }))}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            labelFormatter={(label) => `Date: ${label}`}
            content={({ active, payload, label }) => {
              if (active && payload?.length) {
                const total = payload.reduce(
                  (sum, entry) => sum + (entry.value ?? 0),
                  0,
                );
                return (
                  <div className="rounded border bg-white p-3 shadow-lg">
                    <p className="font-medium">{`Date: ${label}`}</p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {`${entry.dataKey}: ${entry.value ?? 0}`}
                      </p>
                    ))}
                    <p className="mt-1 border-t pt-1 font-semibold">{`Total: ${total}`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          {allActionTypes.map((actionType) => (
            <Bar
              key={actionType}
              dataKey={actionType}
              stackId="actions"
              fill={actionColors[actionType as keyof typeof actionColors]}
              name={actionType}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SwipesChart;
