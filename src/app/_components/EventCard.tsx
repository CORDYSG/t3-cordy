"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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

type EventCardProps = {
  opp: OppWithZoneType;
  static?: boolean;
  pointerNone?: boolean;
  button?: boolean;
  pauseQueries?: (paused: boolean) => void;
  disableInteractions?: boolean;
};

export default function EventCard({
  opp,
  static: isStatic,
  pointerNone,
  disableInteractions,
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

  // if (isDesktop) {
  //   return (
  //     <Dialog open={open} onOpenChange={setOpen}>
  //       <DialogTrigger
  //         asChild
  //         className={` ${disableInteractions ? "pointer-events-none touch-none select-none" : ""}`}
  //       >
  //         <div
  //           className={`card flex h-full w-full flex-col justify-start rounded-lg p-4 transition-all ${disableInteractions ? "" : "cursor-pointer"}`}
  //         >
  //           <div className="relative mb-3 h-0 w-full overflow-hidden rounded-lg border-2 pb-[56.25%]">
  //             {opp.thumbnail_url ? (
  //               <Image
  //                 src={opp.thumbnail_url}
  //                 fill
  //                 loading="lazy"
  //                 sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
  //                 blurDataURL={opp.thumbnail_url}
  //                 placeholder="blur"
  //                 alt={opp.name}
  //                 className="absolute inset-0 h-full w-full object-cover"
  //               />
  //             ) : (
  //               <div className="bg-background absolute inset-0 flex items-center justify-center">
  //                 <Image
  //                   src="https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
  //                   width={64}
  //                   height={64}
  //                   alt="Cordy Face"
  //                   className="object-contain"
  //                 />
  //               </div>
  //             )}
  //           </div>

  //           <div
  //             ref={zonesContainerRef}
  //             className="mb-4 flex w-full flex-col items-center gap-2"
  //           >
  //             <div ref={zonesRef} className="flex w-full flex-col gap-2">
  //               {opp.zones.map((zone: ZoneType) => (
  //                 <EventZone key={zone.id} zone={zone} />
  //               ))}
  //             </div>
  //           </div>

  //           <h2 className="mb-2 line-clamp-3 text-left text-base leading-tight font-black">
  //             {opp.name}
  //           </h2>
  //           <p className="mb-2 text-xs leading-tight font-bold text-gray-700">
  //             {opp.organisation}
  //           </p>
  //           <p className="mb-auto line-clamp-3 text-left text-sm">
  //             {opp.caption}
  //           </p>

  //           <div className="mt-3 border-t border-gray-100 pt-2">
  //             <p className="text-left text-xs text-gray-500">
  //               {opp.deadline ? formatDate(opp.deadline) : "Forever"}
  //             </p>
  //             {daysLeft !== null ? (
  //               <p className="text-primary text-left text-xs font-bold">
  //                 {daysLeft > 0
  //                   ? `${daysLeft} days left`
  //                   : "Deadline has passed"}
  //               </p>
  //             ) : (
  //               <p className="text-left text-xs font-bold text-gray-700">
  //                 No deadline
  //               </p>
  //             )}
  //           </div>
  //         </div>
  //       </DialogTrigger>

  //       <DialogContent className="!shadow-brand max-w-[425px] rounded-md border-2 bg-white p-8 md:max-w-[800px]">
  //         <DialogHeader className="flex w-full flex-row gap-5">
  //           <div className="relative min-h-56 w-full rounded-md border-2 md:max-h-48 md:max-w-1/3">
  //             {opp.thumbnail_url ? (
  //               <Image
  //                 src={opp.thumbnail_url}
  //                 fill
  //                 sizes="(max-width: 768px) 100vw, 33vw"
  //                 blurDataURL={opp.thumbnail_url}
  //                 placeholder="blur"
  //                 alt={opp.name}
  //                 className="absolute inset-0 h-full w-full rounded-md object-cover"
  //               />
  //             ) : (
  //               <div className="bg-background absolute inset-0 flex items-center justify-center rounded-lg">
  //                 <Image
  //                   src="https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
  //                   width={80}
  //                   height={80}
  //                   alt="Cordy Face"
  //                   className="object-contain"
  //                 />
  //               </div>
  //             )}
  //           </div>
  //           <div className="flex w-full flex-col justify-between pb-4">
  //             <div>
  //               <DialogTitle className="text-3xl font-black">
  //                 {opp.name}
  //               </DialogTitle>
  //               <p className="mb-2 text-xs leading-tight font-bold text-gray-700">
  //                 {opp.organisation}
  //               </p>
  //               <div className="my-4 flex flex-wrap gap-2">
  //                 {opp.zones &&
  //                   opp.zones.length > 0 &&
  //                   opp.zones.map((zone: ZoneType) => (
  //                     <EventZone key={zone.id} zone={zone} />
  //                   ))}
  //               </div>
  //             </div>
  //             <div className="my-2 w-full border-2 border-b border-dashed"></div>
  //             <div>
  //               <div className="space-y-1">
  //                 <p className="text-sm text-gray-500">
  //                   {opp.deadline ? formatDate(opp.deadline) : "Forever"}
  //                 </p>
  //                 {daysLeft !== null ? (
  //                   <p className="text-primary text-sm font-bold">
  //                     {daysLeft > 0
  //                       ? `${daysLeft} days left`
  //                       : "Deadline has passed"}
  //                   </p>
  //                 ) : (
  //                   <p className="text-sm font-bold text-gray-700">
  //                     No deadline
  //                   </p>
  //                 )}
  //               </div>
  //             </div>
  //           </div>
  //         </DialogHeader>
  //         <DialogDescription className="text-text text-lg">
  //           {opp.information}
  //         </DialogDescription>
  //         <Link
  //           className="flex w-full justify-end"
  //           href={`/opportunities/${opp.airtable_id}`}
  //           target="_blank"
  //           rel="noopener noreferrer"
  //         >
  //           <button className="btn-brand-primary">View more!</button>
  //         </Link>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        asChild
        className={`${disableInteractions ? "pointer-events-none touch-none select-none" : ""}`}
      >
        <div
          className={`card flex h-full w-full flex-col justify-start p-4 transition-all ${disableInteractions ? "" : "cursor-pointer"}`}
        >
          <div className="relative mb-3 h-0 w-full overflow-hidden rounded-lg border-2 pb-[56.25%]">
            {opp.thumbnail_url ? (
              <Image
                src={opp.thumbnail_url}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                blurDataURL={opp.thumbnail_url}
                placeholder="blur"
                alt={opp.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="bg-background absolute inset-0 flex items-center justify-center">
                <Image
                  src="https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
                  width={64}
                  height={64}
                  alt="Cordy Face"
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* <div
            ref={zonesContainerRef}
            className="relative mb-2 flex h-8 items-center overflow-hidden"
          >
            <div
              ref={zonesRef}
              className="absolute flex flex-nowrap items-center gap-2"
            >
              {visibleZones.map((zone: ZoneType) => (
                <EventZone key={zone.id} zone={zone} />
              ))}

              {hiddenCount > 0 && (
                <div className="flex h-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-600">
                  +{hiddenCount} more
                </div>
              )}
            </div>
          </div> */}

          <div
            ref={zonesContainerRef}
            className="mb-4 flex w-full flex-col items-center gap-2"
          >
            <div ref={zonesRef} className="flex w-full flex-col gap-2">
              {opp.zones.map((zone: ZoneType) => (
                <EventZone key={zone.id} zone={zone} />
              ))}
            </div>
          </div>

          <h2 className="mb-2 line-clamp-1 text-left text-base font-bold">
            {opp.name}
          </h2>

          <p className="mb-auto line-clamp-3 text-left text-sm text-gray-700">
            {opp.caption}
          </p>
          <p className="mb-2 text-xs leading-tight font-bold text-gray-700">
            {opp.organisation}
          </p>
          <div className="mt-3 border-t border-gray-100 pt-2">
            <p className="text-left text-xs text-gray-500">
              {opp.deadline ? formatDate(opp.deadline) : "Forever"}
            </p>
            {daysLeft !== null ? (
              <p className="text-primary text-left text-xs font-bold">
                {daysLeft > 0 ? `${daysLeft} days left` : "Deadline has passed"}
              </p>
            ) : (
              <p className="text-left text-xs font-bold text-gray-700">
                No deadline
              </p>
            )}
          </div>
        </div>
      </DrawerTrigger>

      <DrawerContent className="w-screen bg-white outline-none">
        <div className="flex-1 overflow-y-auto px-4">
          <DrawerHeader>
            <div className="relative h-48 w-full overflow-hidden rounded-md border-2">
              {opp.thumbnail_url ? (
                <Image
                  src={opp.thumbnail_url}
                  fill
                  sizes="100vw"
                  blurDataURL={opp.thumbnail_url}
                  placeholder="blur"
                  alt={opp.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="bg-background absolute inset-0 flex items-center justify-center">
                  <Image
                    src="https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
                    width={80}
                    height={80}
                    alt="Cordy Face"
                    className="object-contain"
                  />
                </div>
              )}
            </div>
            <DrawerTitle className="mt-4 text-2xl font-black">
              {opp.name}
            </DrawerTitle>
            <p className="mb-2 text-xs leading-tight font-bold text-gray-700">
              {opp.organisation}
            </p>
            <div className="my-2 flex flex-wrap gap-2">
              {opp.zones.map((zone: ZoneType) => (
                <EventZone key={zone.id} zone={zone} />
              ))}
            </div>

            <div className="mt-4 space-y-1">
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
            <div className="my-4 w-full border-2 border-dashed"></div>
            <DrawerDescription className="text-text">
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
            <DrawerClose className="mt-2 text-sm font-semibold text-gray-500">
              Close
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
