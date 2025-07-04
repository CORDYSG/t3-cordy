/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function GalaxyLidIndicator({ session }: { session?: any }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const eyesRef = useRef<HTMLDivElement>(null);

  // Blink every ~4 seconds
  useEffect(() => {
    if (!hovered) return;

    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 4000);

    return () => clearInterval(blinkInterval);
  }, [hovered]);

  // Track mouse inside eyes container
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!eyesRef.current) return;

      const rect = eyesRef.current.getBoundingClientRect();

      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      setMousePos({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    }

    if (hovered) {
      window.addEventListener("mousemove", onMouseMove);
    } else {
      setMousePos({ x: 0, y: 0 });
    }

    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [hovered]);

  const pupilMaxMove = 4;

  return (
    <motion.div
      role="link"
      tabIndex={0}
      onClick={() => router.push("/profile")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push("/profile");
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 500)}
      className="relative w-max cursor-pointer outline-none select-none perspective-[800px]"
      style={{ outline: "none" }}
      initial={{}}
      whileHover={{}}
      whileTap={{ scale: 0.95 }}
    >
      {/* Eyes behind the lid */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={hovered ? { opacity: 1 } : { opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-0 left-0 flex h-full w-full items-center justify-center gap-4 rounded-lg bg-black"
        style={{ zIndex: 0 }}
        ref={eyesRef}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            className="relative flex h-8 w-5 items-center justify-center overflow-hidden rounded-full bg-white"
            style={{ filter: "drop-shadow(0 0 1.5px #000)" }}
          >
            {/* Eyelid */}
            <motion.div
              animate={{ height: blink ? "100%" : "0%" }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full origin-top bg-black"
            />

            {/* Pupil */}
            <motion.div
              className="h-3.5 w-3.5 rounded-full bg-black"
              style={{
                translateX: mousePos.x * pupilMaxMove,
                translateY: mousePos.y * pupilMaxMove,
              }}
            />
          </div>
        ))}
      </motion.div>

      {/* Lid container */}
      <motion.div
        initial={{ rotateX: 0 }}
        animate={hovered ? { rotateX: -75 } : { rotateX: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformOrigin: "top center" }}
        className="relative flex items-center gap-3 rounded-lg border-2 border-black bg-yellow-100 px-4 py-2 shadow-[3px_3px_0_0_#000]"
      >
        {/* Status Light */}
        <div
          className={`relative h-6 w-6 rounded-full border-2 border-black ${
            session?.user ? "bg-green-400" : "bg-red-400 opacity-70"
          } after:absolute after:top-[3px] after:left-[3px] after:z-10 after:h-[8px] after:w-[8px] after:rounded-full after:bg-white after:opacity-100`}
        />

        {/* Label */}
        <span className="font-brand text-lg font-black text-black">
          {session?.user ? "PROFILE" : "NOT SAVED"}
        </span>
      </motion.div>
    </motion.div>
  );
}
