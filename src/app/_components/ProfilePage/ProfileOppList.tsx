"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { api } from "@/trpc/react";
import EventCard from "../EventCard";
import { useMemo, type JSX } from "react";
import LoadingComponent from "../LoadingComponent";

type ProfileOppListProps = {
  likedOpps?: boolean;
  savedOpps?: boolean;
};

export default function ProfileOppList({
  likedOpps = false,
  savedOpps = false,
}: Readonly<ProfileOppListProps>): JSX.Element {
  const likedOppsQuery = api.opp.getUserLikedOpps.useQuery(undefined, {
    enabled: likedOpps,
  });
  const savedOppsQuery = api.opp.getUserSavedOpps.useQuery(undefined, {
    enabled: savedOpps,
  });

  const isLoading =
    (likedOpps && likedOppsQuery.isLoading) ||
    (savedOpps && savedOppsQuery.isLoading);

  const opps = useMemo(() => {
    if (likedOpps && likedOppsQuery.data) {
      return likedOppsQuery.data.opps;
    }
    if (savedOpps && savedOppsQuery.data) {
      return savedOppsQuery.data.opps;
    }
    return [];
  }, [likedOpps, savedOpps, likedOppsQuery.data, savedOppsQuery.data]);

  const expiredCount = useMemo(() => {
    if (likedOpps && likedOppsQuery.data) {
      return likedOppsQuery.data.expiredCount;
    }
    if (savedOpps && savedOppsQuery.data) {
      return savedOppsQuery.data.expiredCount;
    }
    return [];
  }, [likedOpps, savedOpps, likedOppsQuery.data, savedOppsQuery.data]);

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <div className="w-full space-y-4">
      {opps.map((opp) => (
        // @ts-expect-error - opp type may not exactly match EventCard props but works in practice

        <EventCard key={opp.id} opp={opp} listView />
      ))}
      {opps.length == 0 && (
        <p className="font-medium italic">It&apos;s a bit empty here...</p>
      )}
      {opps.length > 0 && (
        <div>
          <p className="font-brand mt-8 text-center font-medium text-gray-500 italic">
            Showing active opportunities only.{" "}
            {typeof expiredCount === "number" && expiredCount > 0 && (
              <>
                <span className="font-bold">{expiredCount}</span>
                {expiredCount === 1 ? " opportunity" : " opportunities"}{" "}
                {expiredCount === 1 ? "has" : "have"} expired and{" "}
                {expiredCount === 1 ? "is" : "are"} not shown here.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
