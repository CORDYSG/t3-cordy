"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import Image from "next/image"; // Import Image from next/image
import EventCard from "./EventCard";
import { motion, AnimatePresence } from "framer-motion";
export type SwipeAction = {
  card: OpportunityType; // Store the full opportunity object instead of just ID
  direction: "left" | "right";
  timestamp: number;
  undone: boolean;
};

export type EventCardWrapperRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
  undoLastSwipe: () => boolean; // Returns true if undo was successful
  canUndo: () => boolean;
  getSwipeHistory: () => SwipeAction[];
};

type EventCardWrapperProps = {
  opportunities: OpportunityType[];
  onSwipeHistoryChange?: (history: SwipeAction[]) => void;
};

const getRandomRotation = () => {
  // Generate a random angle between -10 and 10 degrees, avoiding extreme angles
  const minAngle = -10;
  const maxAngle = 10;
  return Math.random() * (maxAngle - minAngle) + minAngle;
};

const EventCardWrapper = forwardRef<EventCardWrapperRef, EventCardWrapperProps>(
  ({ opportunities, onSwipeHistoryChange }, ref) => {
    // Initialize with the provided opportunities
    const [visibleOpportunities, setVisibleOpportunities] =
      useState<OpportunityType[]>(opportunities);
    const [swipingCard, setSwipingCard] = useState<{
      id: string;
      direction: "left" | "right" | null;
      offset: number;
    } | null>(null);

    // Store card rotations in a ref to maintain them across renders
    // Map of card ID to rotation angle
    const cardRotationsRef = useRef<Map<string, number>>(new Map());

    // Track the full swipe history with complete opportunity data
    const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);

    // Track the most recently swiped card for undo functionality
    const [lastSwipedCard, setLastSwipedCard] = useState<{
      card: OpportunityType;
      direction: "left" | "right";
    } | null>(null);

    // Track if an undo animation is in progress
    const [undoAnimation, setUndoAnimation] = useState<{
      cardId: string;
      direction: "left" | "right";
    } | null>(null);

    // Notify parent component when swipe history changes
    useEffect(() => {
      if (onSwipeHistoryChange) {
        onSwipeHistoryChange(swipeHistory);
      }
    }, [swipeHistory, onSwipeHistoryChange]);

    // Initialize rotations for all cards
    useEffect(() => {
      // For any new cards that don't have a rotation yet, assign one
      opportunities.forEach((opp) => {
        if (!cardRotationsRef.current.has(opp.id)) {
          cardRotationsRef.current.set(opp.id, getRandomRotation());
        }
      });
    }, [opportunities]);

    // Update visible opportunities when props change
    useEffect(() => {
      setVisibleOpportunities(opportunities);
    }, [opportunities]);

    // Refs for touch handling
    const touchStartXRef = useRef<number>(0);
    const currentCardRef = useRef<HTMLDivElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const swipingIdRef = useRef<string | null>(null);

    // Clean up any animation frames on unmount
    useEffect(() => {
      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    const completeSwipe = (id: string, direction: "left" | "right") => {
      // Only allow swiping the top card
      if (
        visibleOpportunities.length === 0 ||
        visibleOpportunities[0]?.id !== id
      ) {
        resetSwipe();
        return;
      }

      // Get the card that's being swiped for undo history
      const swipedCard = visibleOpportunities[0];

      // Set the card as being swiped with direction
      setSwipingCard({ id, direction, offset: 100 }); // Full swipe animation

      // Create a new swipe action for history with the full card data
      const swipeAction: SwipeAction = {
        card: swipedCard, // Store the complete opportunity object
        direction,
        timestamp: Date.now(),
        undone: false,
      };

      // Add to swipe history
      setSwipeHistory((prev) => [...prev, swipeAction]);

      // Save swiped card for potential undo
      setLastSwipedCard({ card: swipedCard, direction });

      // Remove the card after animation completes
      setTimeout(() => {
        setVisibleOpportunities((prev) => prev.filter((opp) => opp.id !== id));
        setSwipingCard(null);
        swipingIdRef.current = null;
      }, 300); // Match the transition duration
    };

    const resetSwipe = () => {
      setSwipingCard(null);
      swipingIdRef.current = null;
    };

    const undoLastSwipe = (): boolean => {
      if (!lastSwipedCard) {
        return false; // No card to undo
      }

      const { card, direction } = lastSwipedCard;

      // Set undo animation state to trigger the slide-in animation
      setUndoAnimation({
        cardId: card.id,
        direction,
      });

      // Add the card back to the visible opportunities at the beginning
      setVisibleOpportunities((prev) => [card, ...prev]);

      // Reset the rotation of the card
      cardRotationsRef.current.set(card.id, 0);

      // Update swipe history to mark the swipe as undone
      setSwipeHistory((prev) => {
        const lastIndex = prev.findIndex(
          (action) =>
            action.card.id === card.id &&
            action.direction === direction &&
            !action.undone,
        );

        if (lastIndex !== -1) {
          const updated = [...prev];
          updated[lastIndex] = { ...updated[lastIndex], undone: true };
          return updated;
        }
        return prev;
      });

      // Clear the last swiped card since we've used it
      setLastSwipedCard(null);

      // Clear the undo animation state after animation completes
      setTimeout(() => {
        setUndoAnimation(null);
      }, 300);

      return true;
    };

    const canUndo = (): boolean => {
      return lastSwipedCard !== null;
    };

    const getSwipeHistory = (): SwipeAction[] => {
      return swipeHistory;
    };

    // Expose swipe methods via ref
    useImperativeHandle(ref, () => ({
      swipeLeft: () => {
        if (visibleOpportunities.length > 0) {
          completeSwipe(visibleOpportunities[0].id, "left");
        }
      },
      swipeRight: () => {
        if (visibleOpportunities.length > 0) {
          completeSwipe(visibleOpportunities[0].id, "right");
        }
      },
      undoLastSwipe,
      canUndo,
      getSwipeHistory,
    }));

    const handleTouchStart = (id: string, e: React.TouchEvent) => {
      // Only allow swiping the top card
      if (
        visibleOpportunities.length === 0 ||
        visibleOpportunities[0]?.id !== id
      ) {
        return;
      }

      if (!e.touches[0]) return;

      // Store the starting X position
      touchStartXRef.current = e.touches[0].clientX;
      // Store the element and ID being swiped
      currentCardRef.current = e.currentTarget as HTMLDivElement;
      swipingIdRef.current = id;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      // Only process for the top card
      if (
        !e.touches[0] ||
        swipingIdRef.current === null ||
        visibleOpportunities.length === 0 ||
        visibleOpportunities[0]?.id !== swipingIdRef.current
      ) {
        return;
      }

      // Use requestAnimationFrame for smooth animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const touchCurrentX = e.touches[0]?.clientX ?? 0;
        const diffX = touchCurrentX - touchStartXRef.current;
        const absDiffX = Math.abs(diffX);

        // Only assign direction if movement exceeds a small threshold
        let direction: "left" | "right" | null = null;
        if (absDiffX > 10) {
          direction = diffX > 0 ? "right" : "left";
        } else {
          direction = swipingCard?.direction ?? null; // keep previous if still under threshold
        }
        // Calculate how far into the swipe we are (0-100)
        // Max at 45 degrees rotation which happens around 100px movement
        const swipeOffset = Math.min(absDiffX / 2, 100);

        if (
          swipingCard?.id !== swipingIdRef.current ||
          swipingCard?.offset !== swipeOffset ||
          swipingCard?.direction !== direction
        ) {
          setSwipingCard({
            id: swipingIdRef.current!,
            direction,
            offset: swipeOffset,
          });
        }
      });
    };

    const handleTouchEnd = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Only process for the top card
      if (
        !swipingCard ||
        swipingIdRef.current === null ||
        visibleOpportunities.length === 0 ||
        visibleOpportunities[0]?.id !== swipingIdRef.current
      ) {
        resetSwipe();
        return;
      }

      // If we've moved more than the threshold, complete the swipe
      if (swipingCard.offset > 30 && swipingCard.direction) {
        completeSwipe(swipingIdRef.current, swipingCard.direction);
      } else {
        // Reset if the swipe wasn't far enough
        resetSwipe();
      }
    };

    const handleTouchCancel = () => {
      // Handle touch cancellation (important for smooth experience)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      resetSwipe();
    };

    if (!visibleOpportunities || visibleOpportunities.length === 0) {
      return (
        <div className="flex min-h-[380px] flex-col items-center justify-center py-4 text-center text-xl">
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
      );
    }

    // Limit to the top 4 cards
    const displayedOpportunities = visibleOpportunities.slice(0, 4);

    return (
      <div className="relative my-4 max-h-[380px] min-h-[380px] w-[350px]">
        {displayedOpportunities.map((opp, index) => {
          const isTopCard = index === 0;
          const level = index + 1;
          const isUndoAnimating =
            undoAnimation && undoAnimation.cardId === opp.id;

          const rotation = isTopCard
            ? 0
            : (cardRotationsRef.current.get(opp.id) ?? 0);

          const motionProps = isTopCard
            ? swipingCard && swipingCard.id === opp.id
              ? {
                  animate: {
                    x: swipingCard.direction === "left" ? -400 : 400,
                    rotate: swipingCard.direction === "left" ? -45 : 45,
                    opacity: 0,
                  },
                  transition: { duration: 0.3 },
                  exit: { opacity: 0 },
                }
              : {}
            : {};

          const undoMotionProps = isUndoAnimating
            ? {
                initial: {
                  x: undoAnimation.direction === "left" ? -400 : 400,
                  rotate: undoAnimation.direction === "left" ? -45 : 45,
                  opacity: 0.5,
                },
                animate: {
                  x: 0,
                  rotate: 0,
                  opacity: 1,
                },
                transition: { duration: 0.3 },
              }
            : {};

          return (
            <motion.div
              key={opp.id}
              className={`absolute mx-auto w-full touch-none ${
                !isTopCard && "pointer-events-none touch-none"
              } ${
                index === 3 &&
                "animate-scale-up-center scale-50 [animation-delay:300ms]"
              }`}
              style={{
                rotate: isTopCard ? undefined : `${rotation}deg`,
                zIndex: -level + 5,
              }}
              {...motionProps}
              {...undoMotionProps}
              onTouchStart={
                isTopCard ? (e) => handleTouchStart(opp.id, e) : undefined
              }
              onTouchMove={isTopCard ? handleTouchMove : undefined}
              onTouchEnd={isTopCard ? handleTouchEnd : undefined}
              onTouchCancel={isTopCard ? handleTouchCancel : undefined}
            >
              <EventCard opportunity={opp} />
            </motion.div>
          );
        })}
      </div>
    );
  },
);

EventCardWrapper.displayName = "EventCardWrapper";

export default EventCardWrapper;
