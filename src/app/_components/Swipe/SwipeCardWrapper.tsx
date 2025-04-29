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

type SwipeDirection = "left" | "right";

interface Opportunity {
  id: number;
  name: string;
}

const OpportunitiesPage = () => {
  // Fetch opportunities from API
  const {
    data: fetchedOpportunities,
    refetch,
    isLoading,
  } = api.userOpp.getFYOpps.useQuery({
    limit: 8,
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [current, setCurrent] = useState(0);
  const [pendingSwipes, setPendingSwipes] = useState<
    { oppId: number; direction: SwipeDirection }[]
  >([]);
  const [lastSwipedOpp, setLastSwipedOpp] = useState<Opportunity | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] =
    useState<SwipeDirection | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const hasInitialLoadedRef = useRef(false);
  // Track newly added opportunities for animation
  const [newlyAddedOpps, setNewlyAddedOpps] = useState<number[]>([]);

  // Update opportunities state when data is fetched
  useEffect(() => {
    if (fetchedOpportunities && fetchedOpportunities.length > 0) {
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

        // Clear the newly added state after animation time

        // Only mark fetching as complete after we've processed the results
        isFetchingRef.current = false;
        hasInitialLoadedRef.current = true;

        // Properly combine previous and new opportunities
        return [...prev, ...newOpps];
      });
    } else if (fetchedOpportunities && fetchedOpportunities.length === 0) {
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

    if (
      !isFetchingRef.current &&
      remainingOpps < 5 &&
      hasInitialLoadedRef.current
    ) {
      console.log("Fetching more opportunities, remaining:", remainingOpps);
      console.log("Current opportunities:", opportunities);
      isFetchingRef.current = true;
      void refetch();
    }
  }, [current, opportunities.length, refetch]); // Only depend on opportunities.length, not the entire array

  // Submit pending swipes to the database
  const mutation = api.userOpp.createOrUpdate.useMutation();
  useEffect(() => {
    if (pendingSwipes.length >= 2) {
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
    }
  }, [pendingSwipes]);

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

      // Add to pending swipes
      setPendingSwipes((prev) => [...prev, { oppId: opp.id, direction: dir }]);
    }
    setCurrent((prev) => prev + 1);
  };

  const undo = () => {
    if (!canUndo || !lastSwipedOpp || undoing) return;

    setUndoing(true);

    // Wait a bit before actually changing state, so animation can be visible
    setTimeout(() => {
      // Remove the last swipe from pendingSwipes
      setPendingSwipes((prev) => prev.slice(0, -1));

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
                  <EventCard opp={opp} pointerNone />
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

      {/* Stats for debugging */}
      {/* <div className="mt-4 text-sm text-gray-500">
        <p>Total opportunities: {opportunities.length}</p>
        <p>Current index: {current}</p>
        <p>Pending swipes: {pendingSwipes.length}</p>
        <p>Can undo: {canUndo ? "Yes" : "No"}</p>
        <p>Newly added opps: {newlyAddedOpps.length}</p>
      </div> */}
    </div>
  );
};

export default OpportunitiesPage;
