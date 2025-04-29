/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import type { JSX } from "react";
import EventZone from "./EventZone";
import Image from "next/image";

export default function EventCard(opp: OppWithZoneType): JSX.Element {
  const calculateDaysLeft = (deadline: Date): number => {
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days
  };

  // Function to format the date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const daysLeft = opp.deadline ? calculateDaysLeft(opp.deadline) : null;

  return (
    <div className="card mx-auto min-h-48 max-w-[280px] min-w-[280px] space-y-2 md:min-h-56 md:max-w-sm lg:min-h-90">
      <div className="bg-grey-500 relative min-h-48 min-w-44 rounded-lg border-[2px] p-4">
        {opp.thumbnail_url && (
          <Image
            src={opp.thumbnail_url}
            width={1000}
            height={1000}
            blurDataURL={opp.thumbnail_url}
            placeholder="blur"
            alt={opp.name}
            className="absolute inset-0 h-full w-full rounded-md object-cover"
          />
        )}
        {!opp.thumbnail_url && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-200 text-gray-500"></div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {opp.zones.map((zone: ZoneType) => {
          return <EventZone key={zone.id} zone={zone} />;
        })}{" "}
      </div>

      <h2 className="text-md mb-2 font-bold">{opp.name}</h2>
      <p className="mb-4 text-gray-700">{opp.caption}</p>
      <div>
        <p className="text-sm text-gray-500">
          {opp.deadline ? formatDate(opp.deadline) : "Forever"}
        </p>
        {daysLeft !== null ? (
          <p className="text-primary text-sm font-bold">
            {daysLeft > 0 ? `${daysLeft} days left` : "Deadline has passed"}
          </p>
        ) : (
          <p className="text-sm font-bold text-gray-700">No deadline</p>
        )}
      </div>
    </div>
  );
}
