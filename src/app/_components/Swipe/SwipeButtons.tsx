"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { motion } from "framer-motion";

type SwipeWrapperRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
  empty: boolean;
};

type SwipeBarProps = {
  cardRef: React.RefObject<SwipeWrapperRef | null>;
};

const SwipeButtons: React.FC<SwipeBarProps> = ({ cardRef }) => {
  const [isAnimating, setIsAnimating] = useState<"left" | "right" | null>(null);

  const handleThumbsDown = () => {
    if (!cardRef.current) return;
    setIsAnimating("left");
    cardRef.current.swipeLeft();
    setTimeout(() => setIsAnimating(null), 500);
  };

  const handleThumbsUp = () => {
    if (!cardRef.current) return;
    setIsAnimating("right");
    cardRef.current.swipeRight();
    setTimeout(() => setIsAnimating(null), 500);
  };

  // Animation variants
  const buttonVariants = {
    left: {
      rotate: [-80, 20, -30, 10, 0],
      scale: [1, 1.3, 1],
      x: [-10, 10, -5, 5, 0],
      transition: { duration: 0.5 },
    },
    right: {
      rotate: [80, -20, 30, -10, 0],
      scale: [1, 1.3, 1],
      x: [10, -10, 5, -5, 0],
      transition: { duration: 0.5 },
    },
    rest: {
      rotate: 0,
      scale: 1,
      x: 0,
    },
  };

  return (
    <div className="relative container mx-auto max-w-1/2 min-w-4/6">
      <div className="absolute bottom-20 mb-4 hidden w-full min-w-[200px] items-center justify-between lg:flex">
        {/* Thumbs Down Button */}
        <motion.button
          className={`cursor-pointer rounded-full border-2 border-black bg-white p-6 font-semibold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-300 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
          onClick={handleThumbsDown}
          onTouchStart={handleThumbsDown}
          variants={buttonVariants}
          animate={isAnimating === "left" ? "left" : "rest"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ThumbsDown size={42} fill="white" strokeWidth={1.5} color="black" />
        </motion.button>

        {/* Thumbs Up Button */}
        <motion.button
          className={`bg-accent-green hover:bg-accent-blue-hover cursor-pointer rounded-full border-2 border-black p-6 font-semibold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
          onClick={handleThumbsUp}
          onTouchStart={handleThumbsUp}
          variants={buttonVariants}
          animate={isAnimating === "right" ? "right" : "rest"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ThumbsUp size={42} strokeWidth={1.5} fill="white" color="black" />
        </motion.button>
      </div>
    </div>
  );
};

export default SwipeButtons;
