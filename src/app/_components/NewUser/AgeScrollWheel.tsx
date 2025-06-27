"use client";

import React, { useState, useRef, useEffect, UIEvent } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { AgeRange } from "@prisma/client";

interface AgeScrollWheelProps {
  selectedAge?: AgeRange;
  onAgeChange: (age: AgeRange) => void;
}

const AgeScrollWheel: React.FC<AgeScrollWheelProps> = ({
  selectedAge,
  onAgeChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const ageOptions = [
    { value: "12_BELOW", label: "12 and Below" },
    { value: "TWELVE", label: "12" },
    { value: "THIRTEEN", label: "13" },
    { value: "FOURTEEN", label: "14" },
    { value: "FIFTEEN", label: "15" },
    { value: "SIXTEEN", label: "16" },
    { value: "SEVENTEEN", label: "17" },
    { value: "EIGHTEEN", label: "18" },
    { value: "NINETEEN", label: "19" },
    { value: "TWENTY", label: "20" },
    { value: "TWENTY_ONE", label: "21" },
    { value: "TWENTY_TWO", label: "22" },
    { value: "TWENTY_THREE", label: "23" },
    { value: "TWENTY_FOUR", label: "24" },
    { value: "TWENTY_FIVE", label: "25" },
    { value: "ABOVE_25", label: "Above 25" },
  ];

  const itemHeight = 60;
  const visibleItems = 5;
  const containerHeight = visibleItems * itemHeight;

  useEffect(() => {
    if (selectedAge && scrollRef.current) {
      const selectedIndex = ageOptions.findIndex(
        (opt) => opt.value === selectedAge,
      );
      if (selectedIndex !== -1) {
        const targetScroll =
          selectedIndex * itemHeight - (containerHeight / 2 - itemHeight / 2);
        scrollRef.current.scrollTop = targetScroll;
        setScrollTop(targetScroll);
      }
    }
  }, [selectedAge]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    const centerPosition = newScrollTop + containerHeight / 2;
    const selectedIndex = Math.round(
      (centerPosition - itemHeight / 2) / itemHeight,
    );
    const clampedIndex = Math.max(
      0,
      Math.min(ageOptions.length - 1, selectedIndex),
    );
    if (ageOptions[clampedIndex].value !== selectedAge) {
      onAgeChange(ageOptions[clampedIndex].value as AgeRange);
    }
  };

  return (
    <div className="relative mx-auto w-48">
      {/* Highlight overlay */}
      <div
        className="pointer-events-none absolute right-0 left-0 z-10 rounded-lg border-2 border-blue-500"
        style={{
          top: `${containerHeight / 2 - itemHeight / 2}px`,
          height: `${itemHeight}px`,
        }}
      />

      {/* Scrollable area */}
      <div
        ref={scrollRef}
        className="scrollbar-hide overflow-y-scroll"
        style={{ height: `${containerHeight}px` }}
        onScroll={handleScroll}
      >
        <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />

        {ageOptions.map((option, i) => {
          const offset =
            i * itemHeight - scrollTop + itemHeight / 2 - containerHeight / 2;
          const distance = Math.abs(offset);
          const scale = Math.max(1 - distance / 300, 0.5);
          const opacity = Math.max(1 - distance / 200, 0.3);
          const rotateX = (offset / containerHeight) * 40;

          return (
            <motion.div
              key={option.value}
              style={{
                height: `${itemHeight}px`,
                scale,
                opacity,
                rotateX,
                transformOrigin: "center",
                perspective: 1000,
              }}
              className="flex cursor-pointer items-center justify-center text-lg font-medium select-none"
              onClick={() => onAgeChange(option.value as AgeRange)}
            >
              {option.label}
            </motion.div>
          );
        })}

        <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />
      </div>

      {/* Top & Bottom fade */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 h-16 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

export default AgeScrollWheel;
