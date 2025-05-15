/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import EventZone from "./EventZone";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useMediaQuery } from "@uidotdev/usehooks";

type EventCardProps = {
  opp: OppWithZoneType;
  static?: boolean; // <-- add static prop
  pointerNone?: boolean; // <-- add pointerNone prop
  button?: boolean; // <-- add button prop
  pauseQueries?: (paused: boolean) => void;
};

export default function EventCard({
  opp,
  static: isStatic,
  pointerNone,
  pauseQueries,
}: Readonly<EventCardProps>): JSX.Element {
  const [open, setOpen] = useState(false);

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
  const [isMounted, setIsMounted] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

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

  const handleButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    airtable_id: string,
  ) => {
    if (!pointerNone) {
      e.preventDefault();
      if (pauseQueries) {
        pauseQueries(true);
      }

      router.push(`/opportunities/${airtable_id}`);
    }
  };

  const snapPoints = ["355px", 1];
  const [snap, setSnap] = useState<number | string | null>(
    snapPoints[0] ?? null,
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div
            className={`card flex h-full cursor-pointer flex-col justify-start outline-none ${isStatic ? "max-h-[420px] max-w-[270px]" : "mx-auto min-h-48 max-w-[280px] min-w-[280px] space-y-2 md:min-h-56 md:max-w-sm lg:min-h-90"}`}
            // onClick={(e) => handleButtonClick(e, opp.airtable_id)}
          >
            <div
              className={`bg-grey-500 relative rounded-lg border-[2px] p-4 select-none ${isStatic ? "min-h-36 min-w-44" : "min-h-48 min-w-44"}`}
              style={{ width: "100%" }}
            >
              {opp.thumbnail_url && (
                <Image
                  src={opp.thumbnail_url}
                  width={1000}
                  height={1000}
                  loading="lazy"
                  blurDataURL={opp.thumbnail_url}
                  placeholder="blur"
                  alt={opp.name}
                  className="absolute inset-0 h-full w-full rounded-md object-cover"
                />
              )}
              {!opp.thumbnail_url && (
                <div
                  className="bg-background absolute inset-0 flex items-center justify-center rounded-lg p-12"
                  style={{ padding: "3rem" }}
                >
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
              className="relative my-2 mt-2 flex h-8 items-center overflow-hidden"
            >
              <div
                ref={zonesRef}
                className="absolute flex flex-nowrap items-center gap-2"
              >
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
                  {daysLeft > 0
                    ? `${daysLeft} days left`
                    : "Deadline has passed"}
                </p>
              ) : (
                <p className="not-first: text-left text-sm font-bold text-gray-700 select-none">
                  No deadline
                </p>
              )}
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="shadow-brand max-w-[425px] rounded-md border-2 bg-white p-5 md:max-w-[800px]">
          <DialogHeader className="flex w-full flex-row gap-5">
            <div className="relative min-h-56 w-full rounded-md border-2 md:max-h-48 md:max-w-1/3">
              {opp.thumbnail_url && (
                <Image
                  src={opp.thumbnail_url}
                  width={400}
                  height={400}
                  blurDataURL={opp.thumbnail_url}
                  placeholder="blur"
                  alt={opp.name}
                  className="absolute inset-0 h-full w-full rounded-md object-cover"
                />
              )}
              {!opp.thumbnail_url && (
                <div className="bg-background absolute inset-0 flex items-center justify-center rounded-lg px-24 py-24">
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
            <div className="flex w-full flex-col justify-between pb-4">
              {" "}
              <div>
                <DialogTitle className="text-3xl font-bold">
                  {" "}
                  {opp.name}
                </DialogTitle>
                <div className="my-4 flex space-y-2 space-x-2">
                  {" "}
                  {opp.zones &&
                    opp.zones.length > 0 &&
                    opp.zones.map((zone: ZoneType) => (
                      <EventZone key={zone.id} zone={zone} />
                    ))}
                </div>
              </div>
              <div className="h-2 w-full border-b-1 border-gray-800"></div>
              <div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    {opp.deadline ? formatDate(opp.deadline) : "Forever"}
                  </p>
                  {daysLeft !== null ? (
                    <p className="text-primary text-sm font-bold">
                      {daysLeft > 0
                        ? `${daysLeft} days left`
                        : "Deadline has passed"}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-700">
                      No deadline
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="text-text text-lg">
            {opp.information}
          </DialogDescription>
          <Link
            className="flex w-full justify-end"
            href={`/opportunities/${opp.airtable_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="btn-brand-primary">View more!</button>
          </Link>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div
          className={`card flex h-full cursor-pointer flex-col justify-start outline-none ${isStatic ? "max-h-[420px] max-w-[270px]" : "mx-auto min-h-48 max-w-[280px] min-w-[280px] space-y-2 md:min-h-56 md:max-w-sm lg:min-h-90"}`}
        >
          <div
            className={`bg-grey-500 relative rounded-lg border-[2px] p-4 select-none ${isStatic ? "min-h-36 min-w-44" : "min-h-48 min-w-44"}`}
            style={{ width: "100%" }}
          >
            {opp.thumbnail_url && (
              <Image
                src={opp.thumbnail_url}
                width={1000}
                height={1000}
                loading="lazy"
                blurDataURL={opp.thumbnail_url}
                placeholder="blur"
                alt={opp.name}
                className="absolute inset-0 h-full w-full rounded-md object-cover"
              />
            )}
            {!opp.thumbnail_url && (
              <div
                className="bg-background absolute inset-0 flex items-center justify-center rounded-lg p-12"
                style={{ padding: "3rem" }}
              >
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
            className="relative my-2 mt-2 flex h-8 items-center overflow-hidden"
          >
            <div
              ref={zonesRef}
              className="absolute flex flex-nowrap items-center gap-2"
            >
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
        </div>
      </DrawerTrigger>

      <DrawerContent className="w-screen bg-white outline-none">
        <div className="flex-1 overflow-y-auto px-4">
          <DrawerHeader>
            <div className="relative min-h-56 w-full rounded-md border-2 md:max-h-48">
              {opp.thumbnail_url && (
                <Image
                  src={opp.thumbnail_url}
                  width={200}
                  height={200}
                  blurDataURL={opp.thumbnail_url}
                  placeholder="blur"
                  alt={opp.name}
                  className="absolute inset-0 h-full w-full rounded-md object-cover"
                />
              )}
              {!opp.thumbnail_url && (
                <div className="bg-background absolute inset-0 flex items-center justify-center rounded-lg px-24 py-24">
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
            <DrawerTitle className="text-3xl font-bold">{opp.name}</DrawerTitle>

            <div
              ref={zonesContainerRef}
              className="relative my-2 mt-4 h-10 overflow-hidden"
            >
              <div ref={zonesRef} className="absolute flex flex-nowrap gap-2">
                {opp.zones.map((zone: ZoneType) => (
                  <EventZone key={zone.id} zone={zone} />
                ))}
              </div>
            </div>
            <div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {opp.deadline ? formatDate(opp.deadline) : "Forever"}
                </p>
                {daysLeft !== null ? (
                  <p className="text-primary text-sm font-bold">
                    {daysLeft > 0
                      ? `${daysLeft} days left`
                      : "Deadline has passed"}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-gray-700">No deadline</p>
                )}
              </div>
            </div>

            <DrawerDescription className="text-text mt-2 border-t-2 border-gray-400 pt-5">
              {opp.information}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Link
              className="flex w-full"
              href={`/opportunities/${opp.airtable_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="btn-brand-primary w-full">View more!</button>
            </Link>
            <DrawerClose className="my-2 py-5 text-sm font-semibold text-gray-500">
              Close
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
