"use client";
import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

export type SwipeAction = {
  card: OpportunityType; // Store the full opportunity object instead of just ID
  direction: "left" | "right";
  timestamp: number;
  undone: boolean;
};

const ForYouPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">For You Page</h1>
      <p className="mt-4 text-gray-600">This is the For You page content.</p>
    </div>
  );
};

export default ForYouPage;
