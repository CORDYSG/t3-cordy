import { AnimatePresence, motion } from "framer-motion";
import "./BookmarkButton.css";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BookmarkButtonProps = {
  isBookmarked: boolean;
  handleBookmark?: () => void;
};

export const BookmarkButton = ({
  isBookmarked,
  handleBookmark,
}: BookmarkButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`bookmark-btn-container ${isBookmarked ? "bookmarked" : ""}`}
        >
          <AnimatePresence>
            <motion.button
              whileTap="tap"
              onClick={handleBookmark && handleBookmark}
              type="button"
              className="bookmark-btn"
            >
              {isBookmarked && (
                <svg
                  className="svg-icon-bookmark-circle"
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="inherit"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.circle
                    key="bookmark-circle"
                    initial={{
                      scale: 0,
                      opacity: 1,
                    }}
                    animate={{
                      scale: isBookmarked ? [0, 2] : 0,
                      opacity: isBookmarked ? [1, 0] : 0,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2,
                    }}
                    opacity="1"
                    cx="13"
                    cy="13"
                    r="13"
                    fill="inherit"
                  />
                </svg>
              )}
              <motion.svg
                width="26"
                height="26"
                viewBox="0 0 26 22"
                fill="inherit"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    scale: isBookmarked ? [1, 0, 1] : 1,
                    opacity: isBookmarked ? 1 : 1,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  d="M8 5C8 4.44772 8.44772 4 9 4H17C17.5523 4 18 4.44772 18 5V19C18 19.3536 17.7854 19.6744 17.4472 19.8L13 17.5L8.55279 19.8C8.21458 19.6744 8 19.3536 8 19V5Z"
                  fill="inherit"
                />

                {/* Sparkle animations - stars around the bookmark */}
                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    x: 6,
                    y: 0,
                  }}
                  animate={{
                    scale: [1, 2.5],
                    x: isBookmarked ? [6, -6] : 6,
                    y: 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                  }}
                  d="M4.5 12L5 11L5.5 12L5 13L4.5 12Z"
                  fill="inherit"
                />

                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    x: 0,
                    y: -6,
                  }}
                  animate={{
                    scale: [1, 2.5],
                    y: isBookmarked ? [-6, 6] : -6,
                    x: 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                  }}
                  d="M13 24L13.5 23L14 24L13.5 25L13 24Z"
                  fill="inherit"
                />

                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    x: 0,
                    y: 6,
                  }}
                  animate={{
                    scale: [1, 2.5],
                    y: isBookmarked ? [6, -6] : 6,
                    x: 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                  }}
                  d="M13 2L13.5 1L14 2L13.5 3L13 2Z"
                  fill="inherit"
                />

                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    y: 0,
                    x: -6,
                  }}
                  animate={{
                    scale: [1, 2.5],
                    x: isBookmarked ? [-6, 6] : 6,
                    y: 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                  }}
                  d="M22.5 12L23 11L23.5 12L23 13L22.5 12Z"
                  fill="inherit"
                />

                {/* Diagonal sparkles */}
                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    y: 0,
                    x: 0,
                  }}
                  animate={{
                    scale: [1, 2],
                    x: isBookmarked ? [0, 4] : 0,
                    y: isBookmarked ? [0, -4] : 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3,
                  }}
                  d="M20 7L20.5 6.5L21 7L20.5 7.5L20 7Z"
                  fill="inherit"
                />

                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    y: 0,
                    x: 0,
                  }}
                  animate={{
                    scale: [1, 2],
                    x: isBookmarked ? [0, -4] : 0,
                    y: isBookmarked ? [0, -4] : 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3,
                  }}
                  d="M6 7L6.5 6.5L7 7L6.5 7.5L6 7Z"
                  fill="inherit"
                />

                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    y: 0,
                    x: 0,
                  }}
                  animate={{
                    scale: [1, 2],
                    x: isBookmarked ? [0, -4] : 0,
                    y: isBookmarked ? [0, 4] : 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3,
                  }}
                  d="M7 19L7.5 18.5L8 19L7.5 19.5L7 19Z"
                  fill="inherit"
                />

                <motion.path
                  initial={{
                    scale: 0,
                    opacity: 0,
                    y: 0,
                    x: 0,
                  }}
                  animate={{
                    scale: [1, 2],
                    x: isBookmarked ? [0, 4] : 0,
                    y: isBookmarked ? [0, 4] : 0,
                    opacity: isBookmarked ? [0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3,
                  }}
                  d="M19 19L19.5 18.5L20 19L19.5 19.5L19 19Z"
                  fill="inherit"
                />
              </motion.svg>
            </motion.button>
          </AnimatePresence>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-gray-800 text-white">
        {isBookmarked ? "Unsave" : "Save"}
      </TooltipContent>
    </Tooltip>
  );
};
