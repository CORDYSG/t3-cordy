"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import Image from "next/image";
import type { EventCardWrapperRef } from "./EventCardWrapper";

type SwipeBarProps = {
  cardRef: React.RefObject<EventCardWrapperRef | null>;
};

const SwipeBar: React.FC<SwipeBarProps> = ({ cardRef }) => {
  const [isThumbsDownActive, setIsThumbsDownActive] = useState(false);
  const [isThumbsUpActive, setIsThumbsUpActive] = useState(false);

  const handleThumbsDown = () => {
    // Animate button first
    setIsThumbsDownActive(true);

    // Reset animation after a short delay
    setTimeout(() => {
      setIsThumbsDownActive(false);
    }, 150);

    // Trigger the swipe left action
    setTimeout(() => {
      cardRef.current?.swipeLeft();
    }, 100);
  };

  const handleThumbsUp = () => {
    // Animate button first
    setIsThumbsUpActive(true);

    // Reset animation after a short delay
    setTimeout(() => {
      setIsThumbsUpActive(false);
    }, 150);

    // Trigger the swipe right action
    setTimeout(() => {
      cardRef.current?.swipeRight();
    }, 100);
  };

  return (
    <div className="w-full">
      <div className="mb-4 hidden w-full items-center justify-between md:flex">
        <button
          className={`cursor-pointer rounded-full border-2 border-black bg-white p-6 font-semibold text-black transition-all duration-200 ${
            isThumbsDownActive
              ? "rotate-[-10deg] [box-shadow:2px_2px_0px_0px_rgba(0,0,0,1)]"
              : "[box-shadow:4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-300 hover:[box-shadow:6px_6px_0px_0px_rgba(0,0,0,1)]"
          }`}
          onClick={handleThumbsDown}
        >
          <ThumbsDown size={42} fill="white" strokeWidth={1.5} color="black" />
        </button>
        <button
          className={`bg-accent-green cursor-pointer rounded-full border-2 border-black p-6 font-semibold text-black transition-all duration-200 ${
            isThumbsUpActive
              ? "rotate-[10deg] [box-shadow:2px_2px_0px_0px_rgba(0,0,0,1)]"
              : "hover:bg-accent-blue-hover [box-shadow:4px_4px_0px_0px_rgba(0,0,0,1)] hover:[box-shadow:6px_6px_0px_0px_rgba(0,0,0,1)]"
          }`}
          onClick={handleThumbsUp}
        >
          <ThumbsUp size={42} strokeWidth={1.5} fill="white" color="black" />
        </button>
      </div>
      <div className="relative mx-auto mt-28 flex h-24 w-2/3 items-center justify-center md:h-40 md:w-full">
        <Image
          src={
            "https://images.ctfassets.net/ayry21z1dzn2/1sbtihkTXqSQpJwAZJYGL0/e98a51c196797dd5248e2ffbb34011d3/CORDY_Couch_Smile.svg"
          }
          width={400}
          height={400}
          alt="cordy couch smile"
          className=""
        />
      </div>
    </div>
  );
};

export default SwipeBar;
