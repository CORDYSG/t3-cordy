"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type TypingTextProps = {
  text: string;
  className?: string;
  delayPerChar?: number;
  forceFresh?: boolean;
  onTypingEnd?: () => void;
};

export const TypingText: React.FC<TypingTextProps> = ({
  text,
  className = "",
  delayPerChar = 0.03,
  forceFresh = false,
  onTypingEnd,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === "deleting") {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText((prev) => prev.slice(0, -1));
        }, 20); // fast delete
      } else {
        setPhase("typing");
      }
    } else if (phase === "typing") {
      if (displayedText.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + text[prev.length]);
        }, delayPerChar * 1000);
      } else if (displayedText.length == text.length) {
        // ✅ Only call onTypingEnd after typing is fully complete
        onTypingEnd?.();
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, text, phase, delayPerChar, onTypingEnd]);

  useEffect(() => {
    if (forceFresh) {
      setDisplayedText("");
      setPhase("typing");
    } else if (text !== displayedText) {
      setPhase("deleting");
    }
  }, [text, forceFresh]);

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
      <motion.span
        className="-mb-0.5 ml-1 inline-block w-[1.5px] bg-black align-baseline"
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "anticipate" }}
        style={{
          height: "1.3rem", // match the font size
          verticalAlign: "baseline", // ensures it sits at text baseline
        }}
      />
    </span>
  );
};
