"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

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
      return likedOppsQuery.data;
    }
    if (savedOpps && savedOppsQuery.data) {
      return savedOppsQuery.data;
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
    </div>
  );
}
