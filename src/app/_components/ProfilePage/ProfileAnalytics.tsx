"use client";

import { api } from "@/trpc/react";

const ProfileAnalytics = () => {
  const { data: analytics, isLoading } =
    api.analytics.getUserAnalytics.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Streak Display */}
      <div className="rounded-lg bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold">
            {analytics.streak.current} Day Streak
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(analytics.explorerRate * 100)}%
          </div>
          <div className="text-sm text-blue-500">Explorer Rate</div>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.topInterest.category}
          </div>
          <div className="text-sm text-green-500">Top Interest</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.activityPattern.mostActiveTime}
          </div>
          <div className="text-sm text-purple-500">Most Active</div>
        </div>
      </div>

      {/* Personality Insight */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-2 text-lg font-semibold">
          &quot;{analytics.personality.title}&quot;
        </h3>
        <p className="mb-4 text-gray-600">
          {analytics.personality.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {analytics.personality.traits.map((trait) => (
            <span
              key={trait}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">🏆 Badges Earned</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {analytics.badges
            .filter((badge) => badge.earned)
            .map((badge) => (
              <div
                key={badge.id}
                className="flex items-center space-x-3 rounded-lg bg-yellow-50 p-3"
              >
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <div className="font-medium">{badge.name}</div>
                  <div className="text-sm text-gray-500">
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileAnalytics;
