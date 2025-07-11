"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";

interface ScrollablePickerItem {
  value: string | number;
  label: string;
}

interface ScrollablePickerProps {
  items: { label: string; value: string }[];
  selectedValue: string | number;
  onChange: (value: string | number) => void;
  height?: number;
}

const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 5;
const RADIUS = 120;

const ScrollablePicker: React.FC<ScrollablePickerProps> = ({
  items,
  selectedValue,
  onChange,
  height = 250,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visualIndex, setVisualIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const lastTimeRef = useRef(0);
  const lastYRef = useRef(0);
  const velocityHistory = useRef<Array<{ time: number; velocity: number }>>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Correct ref initialization
  const isUpdatingSelection = useRef(false); // Prevent race conditions

  // Helper functions to handle both string/number and object items
  const getItemValue = (
    item: string | number | ScrollablePickerItem,
  ): string | number => {
    return typeof item === "object" ? item.value : item;
  };

  const getItemLabel = (
    item: string | number | ScrollablePickerItem,
  ): string => {
    return typeof item === "object" ? item.label : String(item);
  };

  const getItemByValue = (value: string | number) => {
    return items.find((item) => getItemValue(item) === value);
  };

  // Calculate the angle between each item
  const angleStep = (2 * Math.PI) / Math.max(items.length, VISIBLE_ITEMS);

  // Initialize current index based on selected value
  useEffect(() => {
    const selectedIndex = items.findIndex(
      (item) => getItemValue(item) === selectedValue,
    );
    if (selectedIndex !== -1 && selectedIndex !== currentIndex) {
      setCurrentIndex(selectedIndex);
      setVisualIndex(selectedIndex);
    }
  }, [selectedValue, items]);

  // Centralized function to update selection
  const updateSelection = useCallback(
    (index: number) => {
      if (isUpdatingSelection.current) return;

      const clampedIndex = Math.max(
        0,
        Math.min(items.length - 1, Math.round(index)),
      );
      const selectedItem = items[clampedIndex];
      if (selectedItem === undefined) return;
      const selectedItemValue = getItemValue(selectedItem);

      if (selectedItemValue !== selectedValue) {
        isUpdatingSelection.current = true;
        setCurrentIndex(clampedIndex);
        setVisualIndex(clampedIndex);
        onChange(selectedItemValue);

        // Reset flag after a brief delay
        setTimeout(() => {
          isUpdatingSelection.current = false;
        }, 50);
      }
    },
    [items, selectedValue, onChange],
  );

  // Physics-based momentum animation
  const animateVelocity = useCallback(() => {
    const minVelocity = 0.01;
    const friction = 0.95;

    if (Math.abs(velocity) > minVelocity) {
      setVisualIndex((prev) => {
        const newIndex = prev + velocity;
        return Math.max(0, Math.min(items.length - 1, newIndex));
      });

      setVelocity((prev) => prev * friction);
      animationRef.current = requestAnimationFrame(animateVelocity);
    } else {
      setVelocity(0);
      // Snap to nearest item when animation stops
      setVisualIndex((prev) => {
        const snapped = Math.round(prev);
        const clamped = Math.max(0, Math.min(items.length - 1, snapped));
        updateSelection(clamped);
        return clamped;
      });
    }
  }, [velocity, items.length, updateSelection]);

  useEffect(() => {
    if (velocity !== 0 && !isDragging) {
      animationRef.current = requestAnimationFrame(animateVelocity);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [velocity, animateVelocity, isDragging]);

  // Clean up timeouts on unmount

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Add listeners to stop scroll propagation
    container.addEventListener("wheel", preventDefault, { passive: false });
    container.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      container.removeEventListener("wheel", preventDefault);
      container.removeEventListener("touchmove", preventDefault);
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    // Don't handle wheel events while dragging
    if (isDragging) return;

    // Clear any existing snap timeout
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }

    // Better trackpad detection - trackpads usually have smaller deltaY and deltaMode 0
    const isTrackpad = Math.abs(e.deltaY) < 120 && e.deltaMode === 0;

    let normalizedDelta;
    if (isTrackpad) {
      // For trackpad, use smaller sensitivity and smoother scrolling
      normalizedDelta = e.deltaY * 0.008; // Reduced sensitivity
    } else {
      // For mouse wheel, use discrete steps
      normalizedDelta = e.deltaY > 0 ? 0.5 : -0.5;
    }

    const newIndex = Math.max(
      0,
      Math.min(items.length - 1, visualIndex + normalizedDelta),
    );
    setVisualIndex(newIndex);

    // Set up snapping timeout
    snapTimeoutRef.current = setTimeout(
      () => {
        if (!isDragging) {
          const snapped = Math.round(newIndex);
          const clamped = Math.max(0, Math.min(items.length - 1, snapped));
          updateSelection(clamped);
        }
      },
      isTrackpad ? 150 : 50,
    ); // Longer timeout for trackpad
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Clear any pending operations
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsDragging(true);
    setStartY(e.clientY);
    setStartIndex(visualIndex);
    setVelocity(0);
    velocityHistory.current = [];
    lastTimeRef.current = Date.now();
    lastYRef.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const currentTime = Date.now();
    const deltaY = e.clientY - startY;
    const deltaIndex = -deltaY / ITEM_HEIGHT;
    const newIndex = Math.max(
      0,
      Math.min(items.length - 1, startIndex + deltaIndex),
    );

    // Calculate instantaneous velocity
    const timeDelta = currentTime - lastTimeRef.current;
    if (timeDelta > 0) {
      const currentVelocity = (e.clientY - lastYRef.current) / timeDelta;
      const normalizedVelocity = -currentVelocity * 0.008; // Reduced velocity

      velocityHistory.current.push({
        time: currentTime,
        velocity: normalizedVelocity,
      });

      // Keep only recent history (last 100ms)
      velocityHistory.current = velocityHistory.current.filter(
        (entry) => currentTime - entry.time < 100,
      );
    }

    setVisualIndex(newIndex);
    lastTimeRef.current = currentTime;
    lastYRef.current = e.clientY;
  };

  const disableBodyScroll = () => {
    document.body.style.overflow = "hidden";
  };

  const enableBodyScroll = () => {
    document.body.style.overflow = "";
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Calculate final velocity from recent history
    if (velocityHistory.current.length > 1) {
      const recentVelocities = velocityHistory.current.slice(-3);
      const avgVelocity =
        recentVelocities.reduce((sum, entry) => sum + entry.velocity, 0) /
        recentVelocities.length;
      const finalVelocity = Math.max(-1, Math.min(1, avgVelocity)); // Clamped velocity

      if (Math.abs(finalVelocity) > 0.02) {
        setVelocity(finalVelocity);
      } else {
        // No significant velocity, snap immediately
        updateSelection(visualIndex);
      }
    } else {
      // No velocity data, snap immediately
      updateSelection(visualIndex);
    }
    enableBodyScroll();
    velocityHistory.current = [];
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    // Clear any pending operations
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsDragging(true);
    setStartY(touch.clientY);
    setStartIndex(visualIndex);
    setVelocity(0);

    velocityHistory.current = [];
    lastTimeRef.current = Date.now();
    lastYRef.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    if (!touch) return;
    const currentTime = Date.now();
    const deltaY = touch.clientY - startY;
    const deltaIndex = -deltaY / ITEM_HEIGHT;
    const newIndex = Math.max(
      0,
      Math.min(items.length - 1, startIndex + deltaIndex),
    );

    // Calculate instantaneous velocity
    const timeDelta = currentTime - lastTimeRef.current;
    if (timeDelta > 0) {
      const currentVelocity = (touch.clientY - lastYRef.current) / timeDelta;
      const normalizedVelocity = -currentVelocity * 0.008;

      velocityHistory.current.push({
        time: currentTime,
        velocity: normalizedVelocity,
      });

      velocityHistory.current = velocityHistory.current.filter(
        (entry) => currentTime - entry.time < 100,
      );
    }

    setVisualIndex(newIndex);
    lastTimeRef.current = currentTime;
    lastYRef.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    enableBodyScroll();
    // Calculate final velocity from recent history
    if (velocityHistory.current.length > 1) {
      const recentVelocities = velocityHistory.current.slice(-3);
      const avgVelocity =
        recentVelocities.reduce((sum, entry) => sum + entry.velocity, 0) /
        recentVelocities.length;
      const finalVelocity = Math.max(-1, Math.min(1, avgVelocity));

      if (Math.abs(finalVelocity) > 0.02) {
        setVelocity(finalVelocity);
      } else {
        updateSelection(visualIndex);
      }
    } else {
      updateSelection(visualIndex);
    }

    velocityHistory.current = [];
  };

  const handleItemClick = (index: number) => {
    // Clear any ongoing animations or timeouts
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setVelocity(0);
    updateSelection(index);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative cursor-grab overflow-hidden active:cursor-grabbing"
        style={{
          height: `${height}px`,
          width: "300px",
          perspective: "1000px",
          userSelect: "none",
          touchAction: "none", // Prevents default touch behaviors
        }}
      >
        {/* Gradient overlays for fade effect */}

        {/* Center selection indicator */}

        <div
          className="relative h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${visualIndex * ((angleStep * 180) / Math.PI)}deg)`,
            transition:
              isDragging || velocity !== 0
                ? "none"
                : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {items.map((item, index) => {
            const angle = -index * angleStep;
            const rotationX = angle * (180 / Math.PI);
            const isSelected = Math.round(visualIndex) === index;
            const distance = Math.abs(index - visualIndex);

            // Calculate if item is on the back side of the cylinder
            const normalizedAngle =
              (((rotationX + visualIndex * ((angleStep * 180) / Math.PI)) %
                360) +
                360) %
              360;
            const isOnBackSide = normalizedAngle > 90 && normalizedAngle < 270;

            // Hide items that are on the back side
            if (isOnBackSide) {
              return null;
            }

            const opacity = Math.max(0.3, 1 - distance * 0.2);
            const scale = Math.max(0.8, 1 - distance * 0.1);

            return (
              <div
                key={index}
                onClick={() => handleItemClick(index)}
                className="absolute flex w-full cursor-pointer items-center justify-center transition-colors duration-200"
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  transform: `rotateX(${rotationX}deg) translateZ(${RADIUS}px)`,
                  transformOrigin: "center center",
                  top: "50%",
                  marginTop: `-${ITEM_HEIGHT / 2}px`,
                  opacity: opacity,
                }}
              >
                <div
                  className={`rounded-lg px-6 py-2 transition-all duration-200 select-none ${
                    isSelected
                      ? "bg-primary shadow-brand border-2 text-lg font-extrabold text-white"
                      : "font-bold text-gray-700"
                  } `}
                  style={{
                    transform: `scale(${scale})`,
                  }}
                >
                  {getItemLabel(item)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScrollablePicker;
