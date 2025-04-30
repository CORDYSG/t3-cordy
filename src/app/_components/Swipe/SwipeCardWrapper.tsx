"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useMotionValue,
  animate,
  type PanInfo,
} from "motion/react";
import { api } from "@/trpc/react";
import EventCard from "../EventCard";
import { Check, Undo2, X } from "lucide-react";
import LoadingComponent from "../LoadingComponent";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

type SwipeDirection = "left" | "right";

interface Opportunity {
  id: number;
  name: string;
  airtable_id?: string; // Add airtable_id for tracking seen opportunities
}

// Define a guest history interface for localStorage
interface GuestHistory {
  seenOppIds: string[]; // Store airtable_ids of seen opportunities
  likedOppIds: string[]; // Store airtable_ids of liked opportunities
}

const OpportunitiesPage = () => {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const [guestId, setGuestId] = useState<string>("");
  const [guestHistory, setGuestHistory] = useState<GuestHistory>({
    seenOppIds: [],
    likedOppIds: [],
  });

  // Create or retrieve a guest ID and history for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      // Try to get guestId from localStorage
      const storedGuestId = localStorage.getItem("guestId");
      if (storedGuestId) {
        setGuestId(storedGuestId);
      } else {
        // Generate a new guestId if none exists
        const newGuestId = uuidv4();
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
      }

      // Try to get guest history from localStorage
      const storedHistory = localStorage.getItem("guestHistory");
      if (storedHistory) {
        try {
          const parsedHistory = JSON.parse(storedHistory) as GuestHistory;
          setGuestHistory(parsedHistory);
        } catch (e) {
          console.error("Error parsing guest history from localStorage:", e);
          // Reset guest history if parsing fails
          const newHistory: GuestHistory = { seenOppIds: [], likedOppIds: [] };
          localStorage.setItem("guestHistory", JSON.stringify(newHistory));
          setGuestHistory(newHistory);
        }
      } else {
        // Initialize guest history if none exists
        const newHistory: GuestHistory = { seenOppIds: [], likedOppIds: [] };
        localStorage.setItem("guestHistory", JSON.stringify(newHistory));
        setGuestHistory(newHistory);
      }
    }
  }, [isAuthenticated]);

  // Fetch opportunities from API - choose the appropriate endpoint based on auth status
  const {
    data: fetchedOpportunities,
    refetch,
    isLoading,
  } = isAuthenticated
    ? api.userOpp.getFYOpps.useQuery({
        limit: 8,
      })
    : api.userOpp.getOpportunities.useQuery({
        limit: 8,
        guestId: guestId,
        seenOppIds: guestHistory.seenOppIds, // Pass seen opp IDs to the backend
      });

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [current, setCurrent] = useState(0);
  const [pendingSwipes, setPendingSwipes] = useState<
    { oppId: number; direction: SwipeDirection }[]
  >([]);
  const [lastSwipedOpp, setLastSwipedOpp] = useState<Opportunity | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] =
    useState<SwipeDirection | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const hasInitialLoadedRef = useRef(false);
  // Track newly added opportunities for animation
  const [newlyAddedOpps, setNewlyAddedOpps] = useState<number[]>([]);

  // Mutation for authenticated users
  const mutation = api.userOpp.createOrUpdate.useMutation();

  // Update opportunities state when data is fetched
  useEffect(() => {
    if (!fetchedOpportunities) return;

    // Check if we received a limit message for guest users
    if (
      "limitReached" in fetchedOpportunities &&
      fetchedOpportunities.limitReached
    ) {
      setLimitReached(true);

      // Use cached opportunities if available
      if (
        fetchedOpportunities.cachedOpportunities &&
        fetchedOpportunities.cachedOpportunities.length > 0
      ) {
        setOpportunities((prev) => {
          // Filter out any already loaded opportunities
          const newOpps = fetchedOpportunities.cachedOpportunities
            .filter(
              (newOpp) =>
                !prev.some(
                  (existingOpp) => existingOpp.id === Number(newOpp.id),
                ),
            )
            .map((newOpp: Partial<Opportunity>) => {
              if (newOpp.id !== undefined) {
                return {
                  ...newOpp,
                  id: Number(newOpp.id), // Convert id to number
                };
              }
              console.error("Invalid opportunity object:", newOpp);
              return null; // Filter out invalid objects
            })
            .filter((newOpp): newOpp is Opportunity => newOpp !== null);

          // Track the new opportunity IDs for animation
          setNewlyAddedOpps(newOpps.map((opp) => opp.id));

          // Only mark fetching as complete after we've processed the results
          isFetchingRef.current = false;
          hasInitialLoadedRef.current = true;

          // Properly combine previous and new opportunities
          return [...prev, ...newOpps];
        });
      }
      return;
    }

    // Normal opportunity processing
    if (
      Array.isArray(fetchedOpportunities) &&
      fetchedOpportunities.length > 0
    ) {
      setOpportunities((prev) => {
        // Filter out any already loaded opportunities
        const newOpps = fetchedOpportunities
          .filter(
            (newOpp) =>
              !prev.some((existingOpp) => existingOpp.id === Number(newOpp.id)),
          )
          .map((newOpp) => ({
            ...newOpp,
            id: Number(newOpp.id), // Convert id to number
          }));

        // Track the new opportunity IDs for animation
        setNewlyAddedOpps(newOpps.map((opp) => opp.id));

        // Only mark fetching as complete after we've processed the results
        isFetchingRef.current = false;
        hasInitialLoadedRef.current = true;

        // Properly combine previous and new opportunities
        return [...prev, ...newOpps];
      });
    } else if (
      Array.isArray(fetchedOpportunities) &&
      fetchedOpportunities.length === 0
    ) {
      // Handle case where no new opportunities are returned
      isFetchingRef.current = false;
    }
  }, [fetchedOpportunities]);

  useEffect(() => {
    if (newlyAddedOpps.length > 0) {
      const timeout = setTimeout(() => {
        setNewlyAddedOpps([]);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [newlyAddedOpps]);

  // Check if we need to fetch more opportunities
  useEffect(() => {
    const remainingOpps = opportunities.length - current;

    // Don't fetch more if we've hit the guest limit
    if ((limitReached && !isAuthenticated) || remainingOpps > 4) return;

    if (
      !isFetchingRef.current &&
      remainingOpps < 3 &&
      hasInitialLoadedRef.current
    ) {
      console.log("Fetching more opportunities, remaining:", remainingOpps);
      console.log("Current opportunities:", opportunities);
      isFetchingRef.current = true;
      void refetch();
    }
  }, [current, limitReached, opportunities.length]);

  // Submit pending swipes to the database (only for authenticated users)
  useEffect(() => {
    if (!isAuthenticated || pendingSwipes.length < 2) return;

    const swipesToSubmit = [...pendingSwipes];

    // Here you would submit the swipes to your database
    const submitSwipesToDatabase = async () => {
      try {
        for (const swipe of pendingSwipes) {
          console.log("Submitting swipe:", swipe);
          await mutation.mutateAsync({
            oppId: BigInt(swipe.oppId), // Must be BigInt!
            liked: swipe.direction === "right",
          });
        }

        console.log("Submitting swipes to database:", swipesToSubmit);

        // Clear the pending swipes after successful submission
        setPendingSwipes([]);
      } catch (error) {
        console.error("Error submitting swipes:", error);
      }
    };

    void submitSwipesToDatabase();
  }, [pendingSwipes, isAuthenticated]);

  // Motion values for the active card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Create transform values for the LIKE/NOPE indicators
  const nopeOpacity = useTransform(x, [0, -50, -100], [0, 0.5, 1]);
  const nopeScale = useTransform(x, [0, -100], [0.5, 1]);
  const likeOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  const likeScale = useTransform(x, [0, 100], [0.5, 1]);

  const handleSwipe = (dir: SwipeDirection, index: number) => {
    const opp = opportunities[index];
    if (opp) {
      // Save the last swiped opportunity for potential undo
      setLastSwipedOpp(opp);
      setLastSwipeDirection(dir);
      setCanUndo(true);

      // For authenticated users, add to pending swipes
      if (isAuthenticated) {
        setPendingSwipes((prev) => [
          ...prev,
          { oppId: opp.id, direction: dir },
        ]);
      }
      // For guest users, update localStorage history
      else if (opp.airtable_id) {
        const updatedHistory = { ...guestHistory };

        // Add to seen opportunities if not already there
        if (!updatedHistory.seenOppIds.includes(opp.airtable_id)) {
          updatedHistory.seenOppIds.push(opp.airtable_id);
        }

        // If liked (swiped right), add to liked opportunities
        if (
          dir === "right" &&
          !updatedHistory.likedOppIds.includes(opp.airtable_id)
        ) {
          updatedHistory.likedOppIds.push(opp.airtable_id);
        }

        // Update local state and localStorage
        setGuestHistory(updatedHistory);
        localStorage.setItem("guestHistory", JSON.stringify(updatedHistory));
      }
    }
    setCurrent((prev) => prev + 1);
  };

  const undo = () => {
    if (!canUndo || !lastSwipedOpp || undoing) return;

    setUndoing(true);

    // Wait a bit before actually changing state, so animation can be visible
    setTimeout(() => {
      // Remove the last swipe from pendingSwipes if authenticated
      if (isAuthenticated) {
        setPendingSwipes((prev) => prev.slice(0, -1));
      }
      // For guest users, update localStorage history
      else if (!isAuthenticated && lastSwipedOpp.airtable_id) {
        const updatedHistory = { ...guestHistory };

        // Remove from seen opportunities if it was the last one added
        if (
          updatedHistory.seenOppIds[updatedHistory.seenOppIds.length - 1] ===
          lastSwipedOpp.airtable_id
        ) {
          updatedHistory.seenOppIds.pop();
        }

        // If it was liked and now we're undoing, remove from liked as well
        if (
          lastSwipeDirection === "right" &&
          updatedHistory.likedOppIds[updatedHistory.likedOppIds.length - 1] ===
            lastSwipedOpp.airtable_id
        ) {
          updatedHistory.likedOppIds.pop();
        }

        // Update local state and localStorage
        setGuestHistory(updatedHistory);
        localStorage.setItem("guestHistory", JSON.stringify(updatedHistory));
      }

      // Move back to previous card
      setCurrent((prev) => prev - 1);

      // Disable undo after using it once
      setCanUndo(false);

      // Reset undoing state after animation completes
      setTimeout(() => {
        setUndoing(false);
      }, 600);
    }, 50);
  };

  const handleDragEnd = (info: PanInfo, index: number) => {
    setIsSwiping(false);
    const xOffset = info.offset.x;
    const velocity = info.velocity.x;

    // Threshold for swipe
    const shouldSwipe = Math.abs(xOffset) > 100 || Math.abs(velocity) > 800;

    if (shouldSwipe) {
      const direction = xOffset > 0 ? "right" : "left";
      const targetX = direction === "right" ? 1500 : -1500;

      // Animate the card flying off the screen with a more visible animation
      animate(x, targetX, {
        type: "tween",
        duration: 0.7,
        ease: "easeOut",
        onComplete: () => {
          handleSwipe(direction, index);
          x.set(0); // Reset for next card
        },
      });
    } else {
      // Return to center if not swiped far enough
      animate(x, 0, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });
    }
  };

  // Get all visible opportunities to show (current + future ones)
  const visibleOpps = opportunities.slice(current, current + 4);

  // Get the total number of opportunities in the stack (up to 4)
  const stackSize = Math.min(visibleOpps.length, 4);

  // Show sign-in prompt for guest users who hit the limit
  if (!isAuthenticated && limitReached && opportunities.length <= current) {
    return (
      <div
        style={{ minHeight: "520px" }}
        className="flex min-h-[520px] w-full flex-col items-center justify-center gap-2 p-6 text-center"
      >
        <Image
          src={
            "https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg"
          }
          alt="Neutral Cordy"
          width={120}
          height={500}
          className="mx-auto mb-4"
        />
        <h2 className="text-xl font-semibold">
          You&apos;ve reached the guest limit
        </h2>
        <p className="max-w-md text-gray-600">
          Sign in to see more opportunities tailored to your interests and
          preferences.
        </p>
        <Link href="/api/auth/signin" className="btn-brand-primary uppercase">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 p-6">
      {visibleOpps.length != 0 && (
        <div className="container flex w-full max-w-sm justify-start gap-4 md:w-1/2">
          <button
            className={`btn-secondary flex items-center gap-2 font-semibold uppercase transition-all duration-200 ${
              undoing
                ? "translate-y-0.5 rotate-[-5deg] [box-shadow:1px_1px_0px_0px_rgba(0,0,0,1)]"
                : ""
            } ${!canUndo ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            onClick={undo}
            disabled={!canUndo || undoing}
          >
            <Undo2 size={24} color="black" />
            <p>Back</p>
          </button>
        </div>
      )}

      <div
        style={{ minHeight: "450px" }}
        ref={containerRef}
        className="relative flex min-h-[450px] w-1/4 max-w-sm items-center"
      >
        {isFetchingRef.current && visibleOpps.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <LoadingComponent />
          </div>
        ) : (
          visibleOpps.map((opp, i) => {
            const index = current + i;
            const isTopCard = i === 0;
            const zIndex = visibleOpps.length - i;

            // Calculate offset for stacked cards
            const offsetY = i * 8;
            const offsetRotation = i % 2 === 0 ? -6 : 6;

            // Determine initial position for undo animation
            const undoInitialX = lastSwipeDirection === "right" ? 1500 : -1500;

            // Check if this card was newly added
            const isNewlyAdded = newlyAddedOpps.includes(opp.id);

            // Position for animating the stack
            const stackPosition = stackSize - i - 1;

            return (
              <motion.div
                key={`card-${opp.id}-${index}`}
                drag={isTopCard && !undoing ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                style={{
                  x: isTopCard ? x : 0,
                  y: offsetY,
                  zIndex,
                }}
                initial={
                  undoing && isTopCard
                    ? {
                        x: undoInitialX,
                        y: offsetY,
                        rotate: lastSwipeDirection === "right" ? 15 : -15,
                        opacity: 0,
                      }
                    : isNewlyAdded
                      ? {
                          scale: 0.5,
                          y: offsetY + 100, // Start lower
                          opacity: 0,
                          rotate: offsetRotation * 2, // Exaggerated rotation
                        }
                      : {
                          x: 0,
                          y: offsetY,
                          rotate: isTopCard ? 0 : offsetRotation,
                          opacity: 0,
                        }
                }
                animate={{
                  x: 0,
                  y: offsetY,
                  scale: 1,
                  rotate: (() => {
                    if (!isTopCard) return offsetRotation;
                    if (undoing) return 0;
                    return rotate.get();
                  })(),
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                    duration: isNewlyAdded ? 0.8 : 0.6,
                    delay: isNewlyAdded ? 0.2 : 0,
                  },
                }}
                onDrag={() => setIsSwiping(true)}
                whileTap={isTopCard ? { scale: 1.02 } : undefined}
                onDragEnd={
                  isTopCard && !undoing
                    ? (_, info) => handleDragEnd(info, index)
                    : undefined
                }
                className={`absolute w-full ${
                  isTopCard && !undoing
                    ? "cursor-grab active:cursor-grabbing"
                    : "pointer-events-none"
                }`}
              >
                <div className="flex h-full w-full touch-none items-center justify-center">
                  <EventCard opp={opp} pointerNone={isSwiping} />
                </div>

                {isTopCard && (
                  <>
                    <motion.div
                      className="bg-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 p-4 text-white"
                      style={{
                        opacity: nopeOpacity,
                        scale: nopeScale,
                      }}
                    >
                      <X size={28} />
                    </motion.div>

                    <motion.div
                      className="bg-accent-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 p-4 text-white"
                      style={{
                        opacity: likeOpacity,
                        scale: likeScale,
                      }}
                    >
                      <Check size={28} />
                    </motion.div>
                  </>
                )}
              </motion.div>
            );
          })
        )}
        {!isFetchingRef.current && visibleOpps.length === 0 && (
          <div className="flex h-full w-full flex-col items-center justify-center py-4 text-center text-xl">
            <Image
              src={
                "https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg"
              }
              alt="Neutral Cordy"
              width={120}
              height={500}
              className="mx-auto mb-4"
            />
            <p className="mb-4 italic">&quot;Oh, poop&quot;</p>
            <p className="font-brand">No new opportunities.</p>
          </div>
        )}
      </div>

      {/* Guest user information banner */}
      {!isAuthenticated && !limitReached && (
        <div className="mt-8 rounded-lg bg-gray-100 p-4 text-center text-sm">
          <p>
            You're browsing as a guest.
            <Link
              href="/api/auth/signin"
              className="ml-2 font-semibold text-blue-600 hover:underline"
            >
              Sign in{" "}
            </Link>
            to save your preferences and see tailored opportunities.
          </p>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;
