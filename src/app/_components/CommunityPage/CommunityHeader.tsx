"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface CommunityHeaderProps {
  communityName: string;
  communityFullName: string;
  communityDescription: string;
  memberCount: number;
  isMember: boolean;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  communityName,
  communityFullName,
  communityDescription,
  memberCount,
  isMember,
}) => {
  const [scale, setScale] = useState(1);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateScale = () => {
      if (!titleRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const title = titleRef.current;

      // Reset scale to measure natural size
      title.style.transform = "scale(1)";

      const containerWidth = container.offsetWidth;
      const titleWidth = title.scrollWidth;
      const padding = 40; // Account for padding/margin
      const availableWidth = containerWidth - padding;

      // Calculate scale based on container width and title width
      let newScale = Math.min(availableWidth / titleWidth, 1.2);

      // Set minimum and maximum scale values
      newScale = Math.max(0.4, Math.min(1.5, newScale));

      // Additional responsive scaling based on viewport width
      const viewportWidth = window.innerWidth;
      let viewportScale = 1;

      if (viewportWidth <= 480) {
        viewportScale = 0.7; // was 0.6 → bigger
      } else if (viewportWidth <= 768) {
        viewportScale = 0.75;
      } else if (viewportWidth <= 1024) {
        viewportScale = 0.9;
      }
      newScale *= viewportScale;
      setScale(newScale);
    };

    // Calculate initial scale
    calculateScale();

    // Recalculate on window resize
    const handleResize = () => {
      calculateScale();
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver for more precise container size changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculateScale, 0);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [communityName]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto max-w-7xl pt-8"
      style={{
        paddingBottom: `${Math.max(0.5, scale * 2)}rem`,
        transition: "padding 0.3s ease-out",
      }}
    >
      {/* Main Card */}
      <div className="flex w-full flex-col items-center justify-center">
        {/* Header with dynamic shapes */}
        <div
          className="relative flex w-fit flex-col items-center justify-center"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.3s ease-out",
            height: `${160 * scale}px`, // Approximate height of the scaled content
            minHeight: `${80}px`,
          }}
        >
          <h1
            ref={titleRef}
            className="font-brand relative z-20 -mb-10 text-center text-[10rem] font-black whitespace-nowrap text-white"
            style={{
              WebkitTextStroke: "3px #000000",
              filter: "drop-shadow(4px 4px 0 #000)",
            }}
          >
            {communityName.split("").map((letter, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                }}
                style={{ display: "inline-block" }}
              >
                <motion.span
                  style={{ display: "inline-block" }}
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    delay: 3 + index * 0.05,
                    duration: 0.4,
                    repeat: Infinity,
                    repeatDelay: 8,
                    ease: "easeInOut",
                  }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </motion.span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="relative z-20 -mt-3 w-fit rounded-full border-2 bg-blue-400 p-1 px-2 text-center text-sm font-semibold"
            style={{ boxShadow: "2px 2px 0px 0px rgba(0, 0, 0, 1)" }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.1 }}
          >
            {communityDescription}
          </motion.p>

          {/* Animated Shapes - Positions adjusted for scaling */}
          {/* Square - rotating continuously */}
          <motion.span
            className="absolute z-10 h-18 w-18 border-2 bg-red-500"
            style={{
              top: `${12 / scale}px`,
              left: `${-8 / scale}px`,
              rotate: 12,
            }}
            animate={{
              rotate: [12, 372],
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Star shape using clip-path */}
          <div
            className="absolute z-10"
            style={{
              top: `${-0 / scale}px`,
              right: `${0 / scale}px`,
            }}
          >
            <motion.span
              className="absolute h-14 w-14 bg-black"
              style={{
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                transform: "translate(2px, 2px)",
              }}
              animate={{
                rotate: -360,
                y: [0, -10, 0],
              }}
              transition={{
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            />
            <motion.span
              className="absolute h-14 w-14 bg-green-400"
              style={{
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              }}
              animate={{
                rotate: -360,
                y: [0, -10, 0],
              }}
              transition={{
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          </div>

          {/* Circle */}
          <motion.span
            className="absolute -bottom-5 z-10 h-12 w-12 rounded-full border-2 bg-orange-500 md:bottom-2"
            style={{
              right: `${-24 / scale}px`,

              rotate: 6,
            }}
            animate={{
              rotate: [6, 366],
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Triangle */}
          <div
            className="absolute bottom-2 z-10 md:bottom-5"
            style={{
              left: `${0 / scale}px`,
            }}
          >
            <motion.span
              className="w-8s absolute h-8 bg-black"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                transform: "translate(2px, 2px) rotate(12deg)",
              }}
              animate={{
                rotate: [12, 27, -3, 12],
                scale: [1, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.span
              className="absolute h-8 w-8 bg-blue-400"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                transform: "rotate(12deg)",
              }}
              animate={{
                rotate: [12, 27, -3, 12],
                scale: [1, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>

        {/* Subheader */}
        {/* <motion.div
          className="mt-4 hidden min-h-16 w-full items-center px-4 md:flex"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{
            marginTop: `${Math.max(0.5, scale * 1)}rem`,
            minHeight: `${Math.max(32, scale * 64)}px`,
            transition: "margin-top 0.3s ease-out, min-height 0.3s ease-out",
          }}
        >
          <p className="text-lg font-semibold">{communityFullName}</p>
          <motion.div
            className="ml-auto flex items-center gap-2"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <span className="text-sm text-gray-600">
              {memberCount} visitors
            </span>
          </motion.div>
        </motion.div> */}
      </div>
    </div>
  );
};

export default CommunityHeader;
