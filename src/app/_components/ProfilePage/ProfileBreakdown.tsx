/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable  @typescript-eslint/no-unsafe-assignment */
/* eslint-disable  @typescript-eslint/no-unsafe-return */
/* eslint-disable  @typescript-eslint/no-explicit-any*/
/* eslint-disable  @typescript-eslint/no-unsafe-call*/

"use client";

import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";

interface RadarDataItem {
  zone: string;
  fullZone: string;
  explored: number;
  liked: number;
}

const zoneAliases: Record<string, string> = {
  Environment: "Env",
  Design: "Design",
  "Sports & Health": "Sports+Health",
  "Self Development": "Self Dev",
  "Culture & Arts": "Culture+Arts",
  Media: "Media",
  Entrepreneurship: "Biz",
  "Science & Tech": "Sci+Tech",
  Music: "Music",
  "Social Impact": "Impact",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload as RadarDataItem;
    return (
      <div className="rounded border bg-white p-2 text-sm shadow">
        <p className="font-semibold">{data.fullZone}</p>
        <p>Explored: {data.explored.toFixed(1)}%</p>
        <p>Liked: {data.liked.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

const ProfileBreakdown = () => {
  const { data, isLoading, isError } =
    api.user.getUserInterestBreakdown.useQuery();

  if (isLoading || isError) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-6 w-2/3 rounded-full" />
        <Skeleton className="h-6 w-1/2 rounded-full" />
        <Skeleton className="h-6 w-3/4 rounded-full" />
        <Skeleton className="h-6 w-1/3 rounded-full" />
      </div>
    );
  }

  if (!data || data.totalExplored === 0) {
    return (
      <div className="p-4 text-center text-gray-500 italic">
        No opportunities explored yet. Start exploring to see your interests
        breakdown!
      </div>
    );
  }

  const allZones = Array.from(
    new Set([
      ...Object.keys(data.exploredBreakdown),
      ...Object.keys(data.likedBreakdown),
    ]),
  );
  const topZones = allZones
    .sort((a, b) => {
      const totalA =
        (data.exploredBreakdown[a] ?? 0) +
        (data.totalExplored > 0
          ? ((data.likedBreakdown?.[a] ?? 0) / data.totalExplored) * 100
          : 0);
      const totalB =
        (data.exploredBreakdown[b] ?? 0) +
        (data.totalExplored > 0
          ? ((data.likedBreakdown?.[b] ?? 0) / data.totalExplored) * 100
          : 0);
      return totalB - totalA;
    })
    .slice(0, 6);

  const chartData = topZones.map((zone) => ({
    zone: zoneAliases[zone] ?? zone, // alias (for axis)
    fullZone: zone, // full name (for tooltip)
    explored: data.exploredBreakdown[zone] ?? 0,
    // Fix: Calculate liked as percentage of total explored, not total liked
    liked:
      data.totalExplored > 0
        ? ((data.likedBreakdown?.[zone] ?? 0) / data.totalExplored) * 100
        : 0,
  }));

  const maxValue = Math.max(
    ...chartData.flatMap((d) => [d.explored, d.liked]),
    10, // fallback min max
  );

  const radiusMax = Math.min(100, maxValue * 1.2); // max 100%, zoom in a bit

  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const words = payload.value.split(" ");

    return (
      <text x={x} y={y} textAnchor="middle" fill="#666" fontSize={12} dy={4}>
        {words.map((word: string, index: number) => (
          <tspan
            key={`tspan-${index}`}
            x={x}
            dy={index === 0 ? 0 : 14} // line height approx 14
            style={{ whiteSpace: "pre" }}
          >
            {word}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <div className="shadow-brand flex h-[400px] w-full flex-col items-center justify-center rounded-lg border-2 bg-white p-4">
      <h3 className="mb-6 text-left text-xl font-bold">
        Your Interest Breakdown
      </h3>
      <div className="mb-2 flex space-x-4 text-sm font-semibold text-gray-700">
        <div className="flex items-center space-x-1">
          <div className="h-3 w-3 rounded-sm bg-[#fb8500]" />
          <span>Explored</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="h-3 w-3 rounded-sm bg-[#cc2c39]" />
          <span>Liked</span>
        </div>
      </div>
      <ResponsiveContainer width="80%" height="90%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="zone"
            tick={{ fontSize: 11, fontFamily: "DM Sans", fontWeight: "800" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, radiusMax]}
            tick={{
              fontSize: 8, // 👈 smaller font
              fontFamily: "DM Sans", // optional
              fontWeight: "500", // optional
            }}
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Explored"
            dataKey="explored"
            stroke="#fb8500"
            fill="#ffc44d"
            fillOpacity={0.4}
          />
          <Radar
            name="Liked"
            dataKey="liked"
            stroke="#cc2c39"
            fill="#ef476f"
            fillOpacity={0.8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfileBreakdown;
