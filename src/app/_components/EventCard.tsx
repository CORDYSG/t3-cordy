/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import EventZone from "./EventZone";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

type EventCardProps = {
  opp: OppWithZoneType;
  static?: boolean; // <-- add static prop
  pointerNone?: boolean; // <-- add pointerNone prop
  button?: boolean; // <-- add button prop
};

export default function EventCard({
  opp,
  static: isStatic,
  pointerNone,
}: Readonly<EventCardProps>): JSX.Element {
  const calculateDaysLeft = (deadline: Date): number => {
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days
  };
  const router = useRouter();
  // Function to format the date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const daysLeft = opp.deadline ? calculateDaysLeft(opp.deadline) : null;
  const zonesContainerRef = useRef<HTMLDivElement>(null);
  const zonesRef = useRef<HTMLDivElement>(null);
  const [visibleZones, setVisibleZones] = useState<ZoneType[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);

  // Sort zones by name length - shortest first to maximize visibility
  const sortedZones = useMemo(
    () =>
      ([...opp.zones] as ZoneType[]).sort((a: ZoneType, b: ZoneType) => {
        const nameA = a.name ?? "";
        const nameB = b.name ?? "";
        return nameA.length - nameB.length;
      }),
    [opp.zones],
  );

  useEffect(() => {
    // Define the function to check which zones fit
    const checkVisibleZones = () => {
      if (!zonesContainerRef.current) return;

      const containerWidth = zonesContainerRef.current.offsetWidth;
      const moreIndicatorWidth = 70; // Width for "+X more" text
      let totalWidth = 0;
      let visibleCount = 0;

      // Simple width estimation - this is a rough approximation
      // We use 8px per character plus 24px padding/margins

      for (let i = 0; i < sortedZones.length; i++) {
        // Estimate zone width: text width + padding + gap
        const estimatedWidth = (sortedZones[i]?.name ?? "").length * 8 + 24;

        if (i < sortedZones.length - 1) {
          // Not the last zone - check if we need space for "more"
          if (
            totalWidth + estimatedWidth + moreIndicatorWidth <=
            containerWidth
          ) {
            totalWidth += estimatedWidth;
            visibleCount++;
          } else {
            break;
          }
        } else if (totalWidth + estimatedWidth <= containerWidth) {
          visibleCount++;
        }
      }

      // Ensure we show at least one zone if possible
      visibleCount = Math.max(1, Math.min(visibleCount, sortedZones.length));

      return {
        visible: sortedZones.slice(0, visibleCount),
        hidden: sortedZones.length - visibleCount,
      };
    };

    // Use a resize observer to detect container width changes
    const handleResize = () => {
      const result = checkVisibleZones();
      if (result) {
        setVisibleZones(result.visible);
        setHiddenCount(result.hidden);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (zonesContainerRef.current) {
      resizeObserver.observe(zonesContainerRef.current);
    }

    // Initial calculation
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [sortedZones]); // Only depend on sortedZones, which is memoized

  const handleButtonClick = (airtable_id: string) => {
    if (!pointerNone) {
      router.push(`/opportunities/${airtable_id}`);
    }
  };
  return (
    <button
      className={`card cursor-pointer outline-none ${isStatic ? "max-h-[420px] max-w-[270px]" : "mx-auto min-h-48 max-w-[280px] min-w-[280px] space-y-2 md:min-h-56 md:max-w-sm lg:min-h-90"}`}
      onClick={() => handleButtonClick(opp.airtable_id)}
    >
      <div
        className={`bg-grey-500 relative rounded-lg border-[2px] p-4 select-none ${isStatic ? "min-h-36 min-w-44" : "min-h-48 min-w-44"}`}
      >
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
          <div className="bg-background absolute inset-0 flex items-center justify-center rounded-lg p-8">
            <Image
              src={
                "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
              }
              width={1000}
              height={1000}
              blurDataURL={
                "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
              }
              placeholder="blur"
              alt="Cordy Face"
              className="object-cover"
            />
          </div>
        )}
      </div>
      <div
        ref={zonesContainerRef}
        className="relative my-2 mt-4 h-8 overflow-hidden"
      >
        <div ref={zonesRef} className="absolute flex flex-nowrap gap-2">
          {visibleZones.map((zone: ZoneType) => (
            <EventZone key={zone.id} zone={zone} />
          ))}

          {hiddenCount > 0 && (
            <div className="flex h-8 items-center justify-center text-sm font-semibold text-gray-600">
              +{hiddenCount} more
            </div>
          )}
        </div>
      </div>

      <h2
        className={`text-md mb-2 line-clamp-1 text-left font-bold select-none ${isStatic ? "text-sm" : "text-md"}`}
      >
        {opp.name}
      </h2>
      <p
        className={`mb-4 line-clamp-3 text-left text-gray-700 select-none ${isStatic ? "text-sm" : "text-md"}`}
      >
        {opp.caption}
      </p>
      <div>
        <p className="text-left text-sm text-gray-500 select-none">
          {opp.deadline ? formatDate(opp.deadline) : "Forever"}
        </p>
        {daysLeft !== null ? (
          <p className="text-primary text-left text-sm font-bold select-none">
            {daysLeft > 0 ? `${daysLeft} days left` : "Deadline has passed"}
          </p>
        ) : (
          <p className="not-first: text-left text-sm font-bold text-gray-700 select-none">
            No deadline
          </p>
        )}
      </div>
    </button>
  );
}
