import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatSGT } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const TimeSeriesGraph = ({
  title,
  data,
  period,
  onPeriodChange,
  periodOptions,
  color = "#4cc9f0",
  isLoading,
}: {
  title: string;
  data?: { date: string; count: number }[];
  period?: string;
  isLoading: boolean;
  onPeriodChange?: (period: string) => void;
  periodOptions?: { value: string; label: string }[];
  color?: string;
}) => {
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
        {period && onPeriodChange && periodOptions && (
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="rounded border px-3 py-1 text-sm"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data.map((d) => ({ ...d, date: formatSGT(d.date) }))}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
          />
          <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeSeriesGraph;
