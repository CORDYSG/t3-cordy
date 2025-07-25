"use client";

import ProgressBar from "../AdminCharts/ProgressBar";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const ProfileBreakdown = () => {
  const {
    data: profileBreakDownData,
    isLoading,
    isError,
  } = api.user.getUserLikedZoneBreakdown.useQuery();

  const total = profileBreakDownData?.totalLiked ?? 1; // Avoid division by zero

  useEffect(() => {
    console.log(profileBreakDownData);
  }, [profileBreakDownData]);

  return (
    <div className="shadow-brand h-full w-full rounded-md border-2 bg-white p-4">
      <h3 className="mb-4 text-xl font-bold">Preferences</h3>
      <div className="space-y-4">
        {isLoading ||
          (isError && (
            <>
              <Skeleton className="h-6 w-2/3 rounded-full" />
              <Skeleton className="h-6 w-1/2 rounded-full" />
              <Skeleton className="h-6 w-3/4 rounded-full" />
              <Skeleton className="h-6 w-1/3 rounded-full" />
            </>
          ))}

        {profileBreakDownData &&
          !isLoading &&
          !isError &&
          Object.entries(profileBreakDownData.zoneBreakdown)
            .sort((a, b) => b[1] - a[1]) // Sort descending by value
            .map(([zoneName, count]) => {
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={zoneName}>
                  <ProgressBar label={zoneName} value={percentage} />
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default ProfileBreakdown;
