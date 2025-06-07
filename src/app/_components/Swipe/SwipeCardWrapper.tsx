/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  motion,
  useTransform,
  useMotionValue,
  animate,
  type PanInfo,
} from "framer-motion";
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
  airtable_id?: string;
}

interface GuestHistory {
  seenOppIds: string[];
  likedOppIds: string[];
}

type SwipeWrapperRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
};
interface OpportunitiesPageProps {
  onEmptyChange?: (isEmpty: boolean) => void;
}

const GUEST_LIMIT = 8;
const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 800;
const CARD_OFFSET_Y = 8;
const CARD_ROTATION = 6;

const OpportunitiesPage = forwardRef<SwipeWrapperRef, OpportunitiesPageProps>(
  ({ onEmptyChange }, ref) => {
    const { data: session } = useSession();
    const isAuthenticated = !!session?.user;
    const [guestId, setGuestId] = useState("");
    const [guestHistory, setGuestHistory] = useState<GuestHistory>({
      seenOppIds: [],
      likedOppIds: [],
    });
    const [isLoadingMore, setIsLoadingMore] = useState(true);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const isFetchingRef = useRef(false);
    const hasInitialLoadedRef = useRef(false);

    // State
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [current, setCurrent] = useState(0);
    const [pendingSwipes, setPendingSwipes] = useState<
      { oppId: number; direction: SwipeDirection }[]
    >([]);
    const [lastSwipedOpp, setLastSwipedOpp] = useState<Opportunity | null>(
      null,
    );
    const [lastSwipeDirection, setLastSwipeDirection] =
      useState<SwipeDirection | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [undoing, setUndoing] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [newlyAddedOpps, setNewlyAddedOpps] = useState<number[]>([]);

    // Motion values
    const KEYBOARD_SWIPE_DISTANCE = 1000; // Increased from 300 for faster exit
    const KEYBOARD_SWIPE_DURATION = 0.5; // Faster than drag animation (was 0.5)
    const KEYBOARD_ROTATION_ANGLE = 15; // Added rotation for keyboard swipes
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30]);
    const opacity = useTransform(
      x,
      [
        -KEYBOARD_SWIPE_DISTANCE * 0.8, // Start fading only after 80% of distance
        -KEYBOARD_SWIPE_DISTANCE * 0.9, // More aggressive fade at the end
        -100,
        0,
        100,
        KEYBOARD_SWIPE_DISTANCE * 0.9, // Mirror for right swipe
        KEYBOARD_SWIPE_DISTANCE * 0.8,
      ],
      [
        0.4, // Still 80% visible at 80% distance
        0, // Fully transparent at 90%
        1, // Fully visible near center
        1,
        1,
        0, // Mirror for right swipe
        0.4,
      ],
    );
    const nopeOpacity = useTransform(x, [0, -50, -100], [0, 0.5, 1]);
    const nopeScale = useTransform(x, [0, -100], [0.8, 1]);
    const likeOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
    const likeScale = useTransform(x, [0, 100], [0.8, 1]);

    // API queries
    const {
      data: fetchedOpportunities,
      refetch,
      isLoading,
    } = isAuthenticated
      ? api.userOpp.getFYOpps.useQuery({ limit: GUEST_LIMIT })
      : api.userOpp.getOpportunities.useQuery(
          {
            limit: GUEST_LIMIT,
            guestId,
            seenOppIds: guestHistory.seenOppIds,
          },
          { enabled: !!guestId },
        );

    // Mutations
    const mutation = api.userOpp.createOrUpdate.useMutation();

    // Initialize guest session
    useEffect(() => {
      if (isAuthenticated) return;

      const initializeGuestSession = () => {
        // Guest ID
        const storedGuestId = localStorage.getItem("guestId") ?? uuidv4();
        if (!localStorage.getItem("guestId")) {
          localStorage.setItem("guestId", storedGuestId);
        }
        setGuestId(storedGuestId);

        // Guest history
        try {
          const storedHistory = localStorage.getItem("guestHistory");
          const initialHistory: GuestHistory = storedHistory
            ? JSON.parse(storedHistory)
            : { seenOppIds: [], likedOppIds: [] };
          setGuestHistory(initialHistory);
        } catch (e) {
          console.error("Error parsing guest history:", e);
          const newHistory = { seenOppIds: [], likedOppIds: [] };
          localStorage.setItem("guestHistory", JSON.stringify(newHistory));
          setGuestHistory(newHistory);
        }
      };

      initializeGuestSession();
    }, [isAuthenticated]);

    // Update opportunities when data is fetched
    useEffect(() => {
      if (!fetchedOpportunities) return;

      const processFetchedOpportunities = () => {
        // Handle limit reached for guests
        if (
          "limitReached" in fetchedOpportunities &&
          fetchedOpportunities.limitReached
        ) {
          setLimitReached(true);
          if (fetchedOpportunities.cachedOpportunities?.length) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            updateOpportunities(fetchedOpportunities.cachedOpportunities);
          }
          return;
        }

        // Normal processing
        if (Array.isArray(fetchedOpportunities)) {
          if (fetchedOpportunities.length) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            updateOpportunities(fetchedOpportunities);
          } else {
            isFetchingRef.current = false;
            setIsLoadingMore(false);
          }
        }
      };

      const updateOpportunities = (newOpps: Partial<Opportunity>[]) => {
        setOpportunities((prev) => {
          const filteredNewOpps = newOpps
            .filter(
              (newOpp) =>
                newOpp.id &&
                !prev.some(
                  (existingOpp) => existingOpp.id === Number(newOpp.id),
                ),
            )
            .map((newOpp) => ({
              ...newOpp,
              id: Number(newOpp.id),
            })) as Opportunity[];

          setNewlyAddedOpps(filteredNewOpps.map((opp) => opp.id));
          isFetchingRef.current = false;
          hasInitialLoadedRef.current = true;
          setIsLoadingMore(false);

          return [...prev, ...filteredNewOpps];
        });
      };

      processFetchedOpportunities();
    }, [fetchedOpportunities]);

    // Clear newly added opps after animation
    useEffect(() => {
      if (newlyAddedOpps.length) {
        const timer = setTimeout(() => setNewlyAddedOpps([]), 1000);
        return () => clearTimeout(timer);
      }
    }, [newlyAddedOpps]);

    // Fetch more opportunities when needed
    useEffect(() => {
      const remainingOpps = opportunities.length - current;
      if ((limitReached && !isAuthenticated) || remainingOpps > 4) return;

      setIsLoadingMore(remainingOpps === 0);

      if (
        !isFetchingRef.current &&
        remainingOpps < 3 &&
        hasInitialLoadedRef.current
      ) {
        isFetchingRef.current = true;
        void refetch();
      }
    }, [current, limitReached, opportunities.length, isAuthenticated, refetch]);

    // Submit pending swipes (authenticated only)
    useEffect(() => {
      if (!isAuthenticated || pendingSwipes.length < 2) return;

      const submitSwipes = async () => {
        try {
          // Use mutate instead of mutateAsync to avoid promise issues
          pendingSwipes.forEach((swipe) => {
            mutation.mutate({
              oppId: BigInt(swipe.oppId),
              liked: swipe.direction === "right",
            });
          });
          setPendingSwipes([]);
        } catch (error) {
          console.error("Error submitting swipes:", error);
        }
      };

      void submitSwipes();
    }, [pendingSwipes, isAuthenticated]); // Remo

    const handleSwipe = useCallback(
      (dir: SwipeDirection, index: number) => {
        const opp = opportunities[index];
        if (!opp) return;

        // Save for undo
        setLastSwipedOpp(opp);
        setLastSwipeDirection(dir);
        setCanUndo(true);

        // Update state based on auth
        if (isAuthenticated) {
          setPendingSwipes((prev) => [
            ...prev,
            { oppId: opp.id, direction: dir },
          ]);
        } else if (opp.airtable_id) {
          const updatedHistory = { ...guestHistory };

          if (!updatedHistory.seenOppIds.includes(opp.airtable_id)) {
            updatedHistory.seenOppIds.push(opp.airtable_id);
          }

          if (
            dir === "right" &&
            !updatedHistory.likedOppIds.includes(opp.airtable_id)
          ) {
            updatedHistory.likedOppIds.push(opp.airtable_id);
          }

          setGuestHistory(updatedHistory);
          localStorage.setItem("guestHistory", JSON.stringify(updatedHistory));
        }

        setCurrent((prev) => prev + 1);
      },
      [opportunities, isAuthenticated, guestHistory],
    );

    const undo = useCallback(() => {
      if (!canUndo || !lastSwipedOpp || undoing) return;

      setUndoing(true);

      setTimeout(() => {
        // Update state based on auth
        if (isAuthenticated) {
          setPendingSwipes((prev) => prev.slice(0, -1));
        } else if (lastSwipedOpp.airtable_id) {
          const updatedHistory = { ...guestHistory };

          if (updatedHistory.seenOppIds.at(-1) === lastSwipedOpp.airtable_id) {
            updatedHistory.seenOppIds.pop();
          }

          if (
            lastSwipeDirection === "right" &&
            updatedHistory.likedOppIds.at(-1) === lastSwipedOpp.airtable_id
          ) {
            updatedHistory.likedOppIds.pop();
          }

          setGuestHistory(updatedHistory);
          localStorage.setItem("guestHistory", JSON.stringify(updatedHistory));
        }

        setCurrent((prev) => prev - 1);
        setCanUndo(false);

        setTimeout(() => setUndoing(false), 600);
      }, 50);
    }, [
      canUndo,
      lastSwipedOpp,
      undoing,
      isAuthenticated,
      guestHistory,
      lastSwipeDirection,
    ]);

    const handleDragEnd = useCallback(
      async (info: PanInfo, index: number) => {
        setIsSwiping(false);
        const { offset, velocity } = info;
        const shouldSwipe =
          Math.abs(offset.x) > SWIPE_THRESHOLD ||
          Math.abs(velocity.x) > VELOCITY_THRESHOLD;

        if (shouldSwipe) {
          const direction = offset.x > 0 ? "right" : "left";
          const targetX = direction === "right" ? 1500 : -1500;
          const targetRotate = direction === "right" ? 15 : -15;

          // Animate both position and rotation
          await Promise.all([
            animate(x, targetX, {
              type: "tween",
              duration: 0.4, // Slightly faster than before
              ease: "easeOut",
            }).then(() => x.set(0)),
            animate(rotate, targetRotate, {
              type: "tween",
              duration: 0.4,
              ease: "easeOut",
            }).then(() => rotate.set(0)),
          ]).then(() => {
            handleSwipe(direction, index);
          });
        } else {
          animate(x, 0, {
            type: "spring",
            stiffness: 300,
            damping: 30,
          });
        }
      },
      [x, rotate, handleSwipe],
    );
    // Memoized visible opportunities
    const visibleOpps = useMemo(
      () => opportunities.slice(current, current + 4),
      [opportunities, current],
    );
    const stackSize = Math.min(visibleOpps.length, 4);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (visibleOpps.length === 0 || isSwiping || undoing) return;

        // Left arrow or 'D' key
        if (e.key === "ArrowLeft" || e.key.toLowerCase() === "d") {
          void animateSwipe("left");
        }
        // Right arrow or 'J' key
        else if (e.key === "ArrowRight" || e.key.toLowerCase() === "j") {
          void animateSwipe("right");
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [visibleOpps, isSwiping, undoing]);

    // Update the animateSwipe function

    useImperativeHandle(ref, () => ({
      swipeLeft: () => animateSwipe("left"),
      swipeRight: () => animateSwipe("right"),
    }));

    useEffect(() => {
      if (!onEmptyChange) return;

      const isEmpty =
        (!isLoadingMore &&
          !isFetchingRef.current &&
          visibleOpps.length === 0) ||
        (isFetchingRef.current && visibleOpps.length === 0) ||
        isLoadingMore;

      onEmptyChange(isEmpty);
    }, [
      isLoadingMore,
      isFetchingRef.current,
      visibleOpps.length,
      onEmptyChange,
    ]);

    const animateSwipe = useCallback(
      async (direction: SwipeDirection) => {
        if (visibleOpps.length === 0 || isSwiping || undoing) return;

        setIsSwiping(true);
        const targetX =
          direction === "right"
            ? KEYBOARD_SWIPE_DISTANCE
            : -KEYBOARD_SWIPE_DISTANCE;
        const targetRotate =
          direction === "right"
            ? KEYBOARD_ROTATION_ANGLE
            : -KEYBOARD_ROTATION_ANGLE;

        // Animate both position and rotation
        await Promise.all([
          animate(x, targetX, {
            type: "tween",
            duration: KEYBOARD_SWIPE_DURATION,
            ease: "easeOut",
          }).then(() => x.set(0)),
          animate(rotate, targetRotate, {
            type: "tween",
            duration: KEYBOARD_SWIPE_DURATION,
            ease: "easeOut",
          }).then(() => rotate.set(0)),
        ]).then(() => {
          handleSwipe(direction, current);
          setIsSwiping(false);
        });
      },
      [x, rotate, current, visibleOpps, handleSwipe, isSwiping, undoing],
    );

    // Update the card animation in the render section

    // Guest limit reached view
    if (!isAuthenticated && limitReached && opportunities.length <= current) {
      return (
        <div className="flex min-h-[540px] w-full flex-col items-center justify-center gap-2 p-6 text-center">
          <Image
            src="https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg"
            alt="Neutral Cordy"
            width={120}
            height={500}
            className="mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold">
            You&apos;ve reached the guest limit
          </h2>
          <p className="max-w-md text-gray-600">
            Sign in to see more opportunities tailored to your interests.
          </p>
          <Link href="/api/auth/signin" className="btn-brand-primary uppercase">
            Sign In
          </Link>
        </div>
      );
    }

    // Empty state view
    if (!isLoadingMore && !isFetchingRef.current && visibleOpps.length === 0) {
      return (
        <div className="flex h-full min-h-[540px] w-full flex-col items-center justify-center py-4 text-center text-xl">
          <Image
            src="https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg"
            alt="Neutral Cordy"
            width={120}
            height={500}
            className="mx-auto mb-4"
          />
          <p className="mb-4 italic">&quot;Oh, poop&quot;</p>
          <p className="font-brand">No new opportunities.</p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[620px] w-full flex-col items-center gap-2 p-6 sm:p-4 md:min-h-[660px]">
        {visibleOpps.length > 0 && (
          <div className="container flex w-full max-w-sm justify-start gap-4 md:my-4 md:w-1/2">
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
        <div className="flex w-full items-center justify-center px-6">
          <div
            ref={containerRef}
            className="relative flex min-h-[490px] w-full max-w-sm items-center"
          >
            {(isFetchingRef.current && visibleOpps.length === 0) ||
            isLoadingMore ? (
              <div className="flex h-full w-full items-center justify-center">
                <LoadingComponent />
              </div>
            ) : (
              visibleOpps.map((opp, i) => {
                const index = current + i;
                const isTopCard = i === 0;
                const zIndex = visibleOpps.length - i;
                const offsetY = i * CARD_OFFSET_Y;
                const offsetRotation =
                  i % 2 === 0 ? -CARD_ROTATION : CARD_ROTATION;
                const undoInitialX =
                  lastSwipeDirection === "right" ? 1500 : -1500;
                const isNewlyAdded = newlyAddedOpps.includes(opp.id);
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
                      opacity: isTopCard ? opacity : 1,
                    }}
                    initial={{
                      ...(undoing && isTopCard
                        ? {
                            x: undoInitialX,
                            y: offsetY,
                            rotate: lastSwipeDirection === "right" ? 15 : -15,
                            opacity: 0,
                          }
                        : isNewlyAdded
                          ? {
                              scale: 0.5,
                              y: offsetY + 100,
                              opacity: 0,
                              rotate: offsetRotation * 2,
                            }
                          : {
                              x: 0,
                              y: offsetY,
                              rotate: isTopCard ? 0 : offsetRotation,
                              opacity: 0,
                            }),
                    }}
                    animate={{
                      x: 0,
                      y: offsetY,
                      scale: 1,
                      rotate: isTopCard
                        ? isSwiping
                          ? rotate.get()
                          : 0
                        : offsetRotation,
                      opacity: 1,
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                        duration: isNewlyAdded ? 0.5 : 0.3,
                        delay: isNewlyAdded ? 0.2 : 0,
                      },
                    }}
                    exit={{
                      x: isTopCard
                        ? lastSwipeDirection === "right"
                          ? 1500
                          : -1500
                        : 0,
                      opacity: 0,
                      transition: { duration: 0.2 },
                    }}
                    onDrag={() => setIsSwiping(true)}
                    whileTap={isTopCard ? { scale: 1.02 } : undefined}
                    onDragEnd={
                      isTopCard && !undoing
                        ? (_, info) => handleDragEnd(info, index)
                        : undefined
                    }
                    className={`motion-card absolute w-full ${
                      isTopCard && !undoing
                        ? "cursor-grab active:cursor-grabbing"
                        : "pointer-events-none"
                    }`}
                  >
                    <div className="flex h-full w-full touch-none items-center justify-center">
                      <EventCard
                        opp={opp}
                        pointerNone={isSwiping}
                        disableInteractions={isTopCard && isSwiping}
                      />
                    </div>

                    {isTopCard && (
                      <>
                        <motion.div
                          className="bg-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 p-6 text-white"
                          style={{ opacity: nopeOpacity, scale: nopeScale }}
                        >
                          <X size={32} />
                        </motion.div>

                        <motion.div
                          className="bg-accent-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 p-6 text-white"
                          style={{ opacity: likeOpacity, scale: likeScale }}
                        >
                          <Check size={32} />
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
        {!isAuthenticated && !limitReached && (
          <div className="mt-8 rounded-lg bg-gray-100 p-4 text-center text-sm">
            <p>
              You&apos;re browsing as a guest.
              <Link
                href="/api/auth/signin"
                className="ml-1 font-semibold text-blue-600 hover:underline"
              >
                Sign in
              </Link>
              to save your preferences and see tailored opportunities.
            </p>
          </div>
        )}
      </div>
    );
  },
);

OpportunitiesPage.displayName = "OpportunitiesPage";

export default OpportunitiesPage;
