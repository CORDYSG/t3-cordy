"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  type JSX,
} from "react";
import EventZone from "./EventZone";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
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

import ShareButton from "./ShareButton";
import { toast } from "sonner";
import React from "react";
import { useGuestId } from "@/lib/guest-session";
import { toZonedTime } from "date-fns-tz";
import { differenceInCalendarDays } from "date-fns";

type EventCardProps = {
  opp: OppWithZoneType;
  static?: boolean;
  pointerNone?: boolean;
  button?: boolean;
  isAuthenticated?: boolean;
  pauseQueries?: (paused: boolean) => void;
  disableInteractions?: boolean;
  listView?: boolean;
};

// Memoized image component to prevent unnecessary re-renders
const EventImage = React.memo(
  ({
    src,
    alt,
    className,
    context = "card", // 'card', 'modal', 'list'
    priority = false,
    fill = true,
  }: {
    src?: string;
    alt: string;
    className?: string;
    context?: "card" | "modal" | "list";
    priority?: boolean;
    fill?: boolean;
  }) => {
    const fallbackSrc =
      "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg";

    // Optimize sizes based on context to reduce unnecessary transformations
    const getSizes = (context: string) => {
      switch (context) {
        case "list":
          return "(max-width: 640px) 96px, (max-width: 768px) 192px, 192px";
        case "modal":
          return "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px";
        case "card":
        default:
          return "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw";
      }
    };

    if (src) {
      return (
        <Image
          src={src}
          fill={fill}
          sizes={getSizes(context)}
          placeholder="empty"
          alt={alt}
          className={className}
          priority={priority}
          quality={85} // Reduce from default 75 to 85 for better compression
          // Add format optimization
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      );
    }

    return (
      <div className="bg-background absolute inset-0 flex items-center justify-center">
        <Image
          src={fallbackSrc}
          width={64}
          height={64}
          alt="Cordy Face"
          className="object-contain"
          quality={90} // Higher quality for fallback since it's small
        />
      </div>
    );
  },
);

EventImage.displayName = "EventImage";
// Memoized content component to reduce duplication
const EventContent = ({
  opp,
  daysLeft,
  formatDate,
  zonesRef,
  zonesContainerRef,
  showZones = true,
  showImage = true,
  layout = "card",
  imageContext = "card",
  isAboveFold = false, // New prop to determine priority loading
}: {
  opp: OppWithZoneType;
  daysLeft: number | null;
  formatDate: (date: Date) => string;
  zonesRef?: React.RefObject<HTMLDivElement>;
  zonesContainerRef?: React.RefObject<HTMLDivElement>;
  showZones?: boolean;
  showImage?: boolean;
  layout?: "card" | "list";
  imageContext?: "card" | "modal" | "list";
  isAboveFold?: boolean;
}) => {
  if (layout === "list") {
    return (
      <>
        {showImage && (
          <div className="relative mr-4 h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 md:h-24 md:w-48">
            <EventImage
              src={opp.thumbnail_url}
              alt={opp.name}
              context="list"
              priority={isAboveFold}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}
        <div className="grid flex-1 grid-cols-2 items-center gap-4 md:grid-cols-4 lg:block lg:space-y-2">
          <div className="col-span-3 flex min-w-0 flex-col justify-center lg:col-span-1">
            <div className="col-span-3 flex min-w-0 flex-col justify-center lg:col-span-1">
              <h2 className="font-brand line-clamp-2 text-left text-sm leading-tight font-bold break-words md:mb-1 lg:line-clamp-2">
                {opp.name}
              </h2>
              <p className="line-clamp-2 hidden text-xs leading-tight font-bold break-words text-gray-500 md:flex lg:text-gray-700">
                {opp.organisation}
              </p>
            </div>
            <div className="flex flex-col justify-center md:hidden">
              <p className="text-left text-xs text-gray-700">
                {opp.deadline ? formatDate(opp.deadline) : "Forever"}
              </p>
              {daysLeft !== null ? (
                <p className="text-primary text-left text-xs font-bold">
                  {daysLeft > 0
                    ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`
                    : "Deadline has passed"}
                </p>
              ) : (
                <p className="text-left text-xs font-bold text-gray-700">
                  No deadline
                </p>
              )}
            </div>
          </div>

          <div className="hidden flex-col justify-center md:flex">
            <p className="text-left text-xs text-gray-500">
              {opp.deadline ? formatDate(opp.deadline) : "Forever"}
            </p>
            {daysLeft !== null ? (
              <p className="text-primary text-left text-xs font-bold">
                {daysLeft > 0
                  ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`
                  : "Deadline has passed"}
              </p>
            ) : (
              <p className="text-left text-xs font-bold text-gray-700">
                No deadline
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showImage && (
        <div className="relative mb-3 h-0 w-full overflow-hidden rounded-lg border-2 pb-[56.25%] lg:rounded-xl">
          <EventImage
            src={opp.thumbnail_url}
            alt={opp.name}
            context={imageContext}
            priority={isAboveFold}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}

      {showZones && (
        <div
          ref={zonesContainerRef}
          className="mb-4 flex w-full flex-col items-center"
        >
          <div
            ref={zonesRef}
            className="flex h-7 w-full gap-1 truncate whitespace-nowrap"
          >
            {opp.zones.map((zone: ZoneType, index: number) => {
              const isLast = index === opp.zones.length - 1;
              return (
                <div key={zone.id} className={isLast ? "min-w-0 truncate" : ""}>
                  <EventZone zone={zone} small />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2
        className="font-brand mb-1 line-clamp-2 text-left text-lg leading-tight font-bold lg:mb-2"
        style={{
          overflowWrap: "break-word",
          wordBreak: "break-word",
          hyphens: "auto",
        }}
      >
        {opp.name}
      </h2>
      <p
        className="mb-2 line-clamp-2 truncate text-xs leading-tight font-bold text-gray-500"
        style={{
          overflowWrap: "break-word",
          wordBreak: "break-word",
          hyphens: "auto",
        }}
      >
        {opp.organisation}
      </p>
      <p
        className="mb-auto line-clamp-3 text-left text-sm font-medium text-gray-700 lg:break-words"
        style={{
          overflowWrap: "break-word",
          wordBreak: "break-word",
          hyphens: "auto",
        }}
      >
        {opp.caption}
      </p>

      <div className="mt-3 border-t border-gray-100 pt-2">
        <p className="text-left text-sm font-medium text-black">
          {opp.deadline ? formatDate(opp.deadline) : "Forever"}
        </p>
        {daysLeft !== null ? (
          <p className="text-primary text-md mt-1 text-left font-semibold">
            {daysLeft > 0
              ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`
              : "Deadline has passed"}
          </p>
        ) : (
          <p className="text-left text-xs font-bold text-gray-700">
            No deadline
          </p>
        )}
      </div>
    </>
  );
};

export default function EventCard({
  opp,
  disableInteractions = false,
  listView = false,
  isAuthenticated = false,
  cardIndex = 0,
}: Readonly<EventCardProps & { cardIndex?: number }>): JSX.Element {
  const isAboveFold = cardIndex < 6;

  // State management
  const [open, setOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Refs
  const zonesContainerRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const zonesRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);

  const { guestId } = useGuestId();

  const SGT = "Asia/Singapore";

  const daysLeft = useMemo(() => {
    if (!opp.deadline) return null;

    // Convert both to Singapore timezone
    const now = toZonedTime(new Date(), SGT);
    const deadline = toZonedTime(opp.deadline, SGT);

    return differenceInCalendarDays(deadline, now);
  }, [opp.deadline]);
  const formatDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (date: Date) => formatter.format(date);
  }, []);

  // API hooks
  const { data: userMetrics } = api.userOpp.getUserOppMetrics.useQuery(
    { oppId: parseFloat(opp.id) },
    { enabled: !!isAuthenticated },
  );

  const updateActionMutation = api.userOpp.updateUserOppMetrics.useMutation();
  const userOppMutation = api.userOpp.createOrUpdate.useMutation({
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("You must be logged in to save this opportunity.");
      }
    },
  });

  // Callbacks
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && isScrolling) {
        return;
      }

      setOpen(newOpen);

      if (newOpen && !disableInteractions) {
        updateActionMutation.mutate({
          oppId: opp.id,
          guestId: guestId ?? "",
          action: "CLICK_EXPAND",
        });
      }
    },
    [isScrolling, disableInteractions, guestId, opp.id, updateActionMutation],
  );

  const handleButtonClick = useCallback(() => {
    updateActionMutation.mutate({
      oppId: opp.id,
      guestId: guestId ?? "",
      action: "CLICK",
    });
  }, [opp.id, updateActionMutation]);

  const handleLike = useCallback(() => {
    const newLikeStatus = !isLiked;
    setIsLiked(newLikeStatus);

    userOppMutation.mutate({ oppId: opp.id, liked: newLikeStatus });

    if (guestId) {
      updateActionMutation.mutate({
        oppId: opp.id,
        guestId,
        action: newLikeStatus ? "LIKE" : "UNLIKE",
      });
    }
  }, [isLiked, opp.id, guestId, userOppMutation, updateActionMutation]);

  const handleBookmark = useCallback(() => {
    const newBookmarkStatus = !isBookmarked;
    setIsBookmarked(newBookmarkStatus);

    userOppMutation.mutate({ oppId: opp.id, saved: newBookmarkStatus });

    updateActionMutation.mutate({
      oppId: opp.id,
      guestId: guestId ?? "",
      action: newBookmarkStatus ? "SAVE" : "UNSAVE",
    });
  }, [isBookmarked, opp.id, guestId, userOppMutation, updateActionMutation]);

  // Effects
  useEffect(() => {
    if (userMetrics) {
      setIsLiked(userMetrics.liked);
      setIsBookmarked(userMetrics.saved);
    }
  }, [userMetrics]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    mediaQueryRef.current = mediaQuery;
    const initialIsDesktop = mediaQuery.matches;
    setIsDesktop(initialIsDesktop);

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Render helpers
  const triggerProps = {
    asChild: true,
    ...(disableInteractions && {
      className: "pointer-events-none touch-none select-none",
    }),
  };

  const cardClassName = `card flex h-full w-full transition-all ${
    disableInteractions ? "" : "cursor-pointer hover:shadow-lg"
  } ${listView ? "justify-start rounded-xl p-4" : "flex-col justify-start p-4"}`;

  const TriggerContent = () => (
    <div className={cardClassName} onClick={() => handleOpenChange(!open)}>
      <EventContent
        opp={opp}
        daysLeft={daysLeft}
        formatDate={formatDate}
        zonesRef={zonesRef}
        zonesContainerRef={zonesContainerRef}
        layout={listView ? "list" : "card"}
        imageContext={listView ? "list" : "card"}
        isAboveFold={isAboveFold}
      />
      <div className={` ${!listView && "-mt-5"} flex justify-end`}>
        <Maximize2 size={16} />
      </div>
    </div>
  );

  const ModalContent = () => (
    <>
      <div className="flex w-full items-center justify-end gap-8">
        <ShareButton
          opp_airtable_id={opp.airtable_id}
          oppId={opp.id}
          opp={opp}
        />
        <BookmarkButton
          isBookmarked={isBookmarked}
          handleBookmark={handleBookmark}
        />
        {/* <LikeButton isLiked={isLiked} handleLike={handleLike} /> */}
        <Link
          href={`/opportunities/${opp.airtable_id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <button onClick={handleButtonClick} className="btn-brand-primary">
            View more!
          </button>
        </Link>
      </div>
    </>
  );

  const ModalImage = () => (
    <div className="relative min-h-56 w-full rounded-lg border-2 md:max-h-48 md:max-w-3/5">
      <EventImage
        src={opp.thumbnail_url}
        alt={opp.name}
        context="modal"
        priority={false}
        className="absolute inset-0 h-full w-full rounded-md object-cover"
      />
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger {...triggerProps}>
          <TriggerContent />
        </DialogTrigger>
        <DialogContent
          className="max-w-[425px] rounded-xl border-2 bg-white p-8 md:max-w-[720px]"
          style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
        >
          <DialogHeader className="flex w-full flex-row gap-5">
            <ModalImage />
            <div className="flex w-full flex-col justify-between pb-4">
              <div>
                <DialogTitle
                  className="font-brand text-3xl font-bold"
                  style={{
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    hyphens: "auto",
                  }}
                >
                  {opp.name}
                </DialogTitle>
                <p
                  className="my-2 text-sm leading-tight font-medium text-gray-500"
                  style={{
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    hyphens: "auto",
                  }}
                >
                  {opp.organisation}
                </p>
                <div className="my-2 flex flex-wrap gap-2">
                  {opp.zones?.map((zone: ZoneType) => (
                    <EventZone key={zone.id} zone={zone} />
                  ))}
                </div>
              </div>
              <div className="mb-2 w-full border-b-2 border-dashed"></div>
              <div className="space-y-0">
                <p className="text-md font-medium text-black">
                  {opp.deadline ? formatDate(opp.deadline) : "Forever"}
                </p>
                {daysLeft !== null ? (
                  <p className="text-primary text-md font-medium">
                    {daysLeft > 0
                      ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`
                      : "Deadline has passed"}
                  </p>
                ) : (
                  <p className="text-md font-medium text-gray-700">
                    No deadline
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
          <DialogDescription
            className="text-text line-clamp-6 text-lg whitespace-pre-line"
            style={{
              overflowWrap: "break-word",
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {opp.information}
          </DialogDescription>
          <ModalContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger {...triggerProps}>
        <TriggerContent />
      </DrawerTrigger>
      <DrawerContent className="w-screen bg-white outline-none">
        <div
          className="flex-1 overflow-y-auto px-4"
          onScroll={handleScroll}
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: "20px",
          }}
        >
          <DrawerHeader>
            <ModalImage />
            <DrawerTitle
              className="font-brand mt-4 text-2xl font-bold"
              style={{
                overflowWrap: "break-word",
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {opp.name}
            </DrawerTitle>
            <p
              className="mb-2 text-xs leading-tight font-bold text-gray-500"
              style={{
                overflowWrap: "break-word",
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {opp.organisation}
            </p>
            <div className="my-2 flex flex-wrap gap-2">
              {opp.zones.map((zone: ZoneType) => (
                <EventZone key={zone.id} zone={zone} />
              ))}
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-md font-medium text-black">
                {opp.deadline ? formatDate(opp.deadline) : "Forever"}
              </p>
              {daysLeft !== null ? (
                <p className="text-primary text-md font-medium">
                  {daysLeft > 0
                    ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`
                    : "Deadline has passed"}
                </p>
              ) : (
                <p className="text-md font-medium text-gray-700">No deadline</p>
              )}
            </div>
            <div className="my-4 w-full border-b-2 border-dashed"></div>
            <DrawerDescription
              className="text-text line-clamp-6 whitespace-pre-line"
              style={{
                overflowWrap: "break-word",
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {opp.information}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <div className="flex w-full items-center justify-end gap-8">
              <ShareButton
                opp_airtable_id={opp.airtable_id}
                oppId={opp.id}
                opp={opp}
              />
              <BookmarkButton
                isBookmarked={isBookmarked}
                handleBookmark={handleBookmark}
              />
              {/* <LikeButton isLiked={isLiked} handleLike={handleLike} /> */}
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
            <DrawerClose className="my-4 text-sm font-semibold text-gray-500">
              Close
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
