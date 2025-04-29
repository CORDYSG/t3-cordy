"use client";

import type { JSX } from "react";
import EventTag from "./EventTag";
import Image from "next/image";

export default function EventCardWide(opp: OpportunityType): JSX.Element {
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

  const daysLeft = opp.applicationDeadline
    ? calculateDaysLeft(opp.applicationDeadline)
    : null;

  return (
    <div className="card mx-auto min-h-48 w-full space-y-2 overflow-hidden">
      <div className="bg-grey-500 relative min-h-36 min-w-44 rounded-lg border-[2px] p-4">
        {opp.mainImage && (
          <Image
            src={opp.mainImage}
            width={1000}
            height={1000}
            blurDataURL={opp.mainImage}
            placeholder="blur"
            alt={opp.title}
            className="absolute inset-0 h-full w-full rounded-md object-cover"
          />
        )}
        {!opp.mainImage && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-200 text-gray-500"></div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {opp.tags.map((tag) => {
          return <EventTag key={tag.id} tag={tag.tag} />;
        })}{" "}
      </div>

      <h2 className="text-md mb-2 font-bold">{opp.title}</h2>
      <p className="mb-4 text-gray-700">{opp.shortDesc}</p>
      <div>
        <p className="text-sm text-gray-500">
          {opp.startDate ? formatDate(opp.startDate) : "Forever"}
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
