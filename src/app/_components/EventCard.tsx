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
import { api } from "@/trpc/react";
import { BookmarkButton } from "./BookmarkButton";
import { LikeButton } from "./LikeButton";

type EventCardProps = {
  opp: OppWithZoneType;
  static?: boolean;
  pointerNone?: boolean;
  button?: boolean;
  isAuthenticated?: boolean;
  pauseQueries?: (paused: boolean) => void;
  disableInteractions?: boolean;
};

export default function EventCard({
  opp,
  disableInteractions,
}: Readonly<EventCardProps>): JSX.Element {
  const [open, setOpen] = useState(false);

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
  const zonesContainerRef = useRef<HTMLDivElement>(null);
  const zonesRef = useRef<HTMLDivElement>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [storedGuestId, setStoredGuestId] = useState<string | null>(null);
  const [mockLike, setMockLke] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const initialData = api.userOpp.getUserOppMetrics.useQuery({
    oppId: parseFloat(opp.id),
  });

  const updateAction = api.userOpp.updateUserOppMetrics.useMutation();

  useEffect(() => {
    setStoredGuestId(localStorage.getItem("guestId"));

    // Create a media query and set initial state
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mediaQuery.matches);

    // Listen for changes (optional - only if you want runtime responsiveness)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (initialData.data) {
      console.log("Initial data:>>>>>>>", initialData.data);
      setMockLke(initialData.data.liked);
      setIsBookmarked(initialData.data.saved);
    }
  }, [initialData.data]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    // Run the update mutation when the drawer opens
    if (newOpen && !disableInteractions) {
      updateAction.mutate({
        oppId: opp.id,
        guestId: storedGuestId ?? "",
        action: "CLICK_EXPAND",
      });
    }
  };

  const handleButtonClick = () => {
    updateAction.mutate({
      oppId: opp.id,
      guestId: storedGuestId ?? "",
      action: "CLICK",
    });
  };

  const handleLike = () => {
    const currentLikeStatus = !mockLike;
    setMockLke(currentLikeStatus);
    const storedGuestId = localStorage.getItem("guestId");

    mutation.mutate({
      oppId: opp.id,
      liked: currentLikeStatus,
    });

    updateAction.mutate({
      oppId: opp.id,
      guestId: storedGuestId ?? "",
      action: currentLikeStatus ? "LIKE" : "UNLIKE",
    });
  };

  const mutation = api.userOpp.createOrUpdate.useMutation();

  const handleSave = () => {
    const currentBookmarkStatus = !isBookmarked;
    setIsBookmarked(currentBookmarkStatus);

    mutation.mutate({
      oppId: opp.id,
      saved: currentBookmarkStatus,
    });

    updateAction.mutate({
      oppId: opp.id,
      guestId: storedGuestId ?? "",
      action: currentBookmarkStatus ? "SAVE" : "UNSAVE",
    });
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          asChild
          className={` ${disableInteractions ? "pointer-events-none touch-none select-none" : ""}`}
        >
          <div
            className={`card flex h-full w-full flex-col justify-start rounded-lg p-4 transition-all ${disableInteractions ? "" : "cursor-pointer"}`}
          >
            <div className="relative mb-3 h-0 w-full overflow-hidden rounded-lg border-2 pb-[56.25%]">
              {opp.thumbnail_url ? (
                <Image
                  src={opp.thumbnail_url}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

            <h2 className="mb-2 line-clamp-3 text-left text-base leading-tight font-black">
              {opp.name}
            </h2>
            <p className="mb-2 text-xs leading-tight font-bold text-gray-700">
              {opp.organisation}
            </p>
            <p className="mb-auto line-clamp-3 text-left text-sm">
              {opp.caption}
            </p>

            <div className="mt-3 border-t border-gray-100 pt-2">
              <p className="text-left text-xs text-gray-500">
                {opp.deadline ? formatDate(opp.deadline) : "Forever"}
              </p>
              {daysLeft !== null ? (
                <p className="text-primary text-left text-xs font-bold">
                  {daysLeft > 0
                    ? `${daysLeft} days left`
                    : "Deadline has passed"}
                </p>
              ) : (
                <p className="text-left text-xs font-bold text-gray-700">
                  No deadline
                </p>
              )}
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="!shadow-brand max-w-[425px] rounded-md border-2 bg-white p-8 md:max-w-[800px]">
          <DialogHeader className="flex w-full flex-row gap-5">
            <div className="relative min-h-56 w-full rounded-md border-2 md:max-h-48 md:max-w-1/3">
              {opp.thumbnail_url ? (
                <Image
                  src={opp.thumbnail_url}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  blurDataURL={opp.thumbnail_url}
                  placeholder="blur"
                  alt={opp.name}
                  className="absolute inset-0 h-full w-full rounded-md object-cover"
                />
              ) : (
                <div className="bg-background absolute inset-0 flex items-center justify-center rounded-lg">
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
            <div className="flex w-full flex-col justify-between pb-4">
              <div>
                <DialogTitle className="text-3xl font-black">
                  {opp.name}
                </DialogTitle>
                <p className="mb-2 text-xs leading-tight font-bold text-gray-700">
                  {opp.organisation}
                </p>
                <div className="my-4 flex flex-wrap gap-2">
                  {opp.zones &&
                    opp.zones.length > 0 &&
                    opp.zones.map((zone: ZoneType) => (
                      <EventZone key={zone.id} zone={zone} />
                    ))}
                </div>
              </div>
              <div className="my-2 w-full border-2 border-b border-dashed"></div>
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
          <DialogDescription className="text-text line-clamp-6 text-lg whitespace-pre-line">
            {opp.information}
          </DialogDescription>
          <div className="flex w-full items-center justify-end gap-8">
            <BookmarkButton
              isBookmarked={isBookmarked}
              handleBookmark={handleSave}
            />
            <LikeButton isLiked={mockLike} handleLike={handleLike} />
            <Link
              className=""
              href={`/opportunities/${opp.airtable_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button onClick={handleButtonClick} className="btn-brand-primary">
                View more!
              </button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
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
            <DrawerDescription className="text-text line-clamp-6 whitespace-pre-line">
              {opp.information}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <div className="flex w-full items-center justify-end gap-8">
              <BookmarkButton
                isBookmarked={isBookmarked}
                handleBookmark={handleSave}
              />
              <LikeButton isLiked={mockLike} handleLike={handleLike} />
            </div>
            <Link
              className="flex w-full"
              href={`/opportunities/${opp.airtable_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                onClick={handleButtonClick}
                className="btn-brand-primary w-full"
              >
                View more!
              </button>
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
