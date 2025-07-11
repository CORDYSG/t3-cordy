"use client";

import { useEffect, useRef, useState } from "react";

import SwipeCardWrapper from "@/app/_components/Swipe/SwipeCardWrapper";

import SwipeButtons from "@/app/_components/Swipe/SwipeButtons";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import SwipeTutorialModal from "./SwipeModal";

type SwipeWrapperRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
  empty: boolean;
};

interface GuestHistory {
  seenOppIds: string[];
  likedOppIds: string[];
}

const Wrapper = () => {
  const cardRef = useRef<SwipeWrapperRef>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [guestHistory, setGuestHistory] = useState<GuestHistory>({
    seenOppIds: [],
    likedOppIds: [],
  });
  const [guestId, setGuestId] = useState<string>("");

  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isAuthenticated = !!session?.user;

  const hasSwipedBefore = api.userOpp.hasSwipedBefore.useQuery({
    guestId: guestId,
  });

  useEffect(() => {
    if (isAuthenticated) {
      // If the user is authenticated, we can fetch the next set of opportunities
      setShowTutorial(false);
    } else {
      const storedGuestId = localStorage.getItem("guestId") ?? "";

      const storedHistory = localStorage.getItem("guestHistory") ?? "";
      // If the user is not authenticated, we can check if they have swiped before
      if (storedGuestId) {
        setGuestId(storedGuestId);
        setGuestHistory(JSON.parse(storedHistory));
      } else {
        const newGuestId = crypto.randomUUID();
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (hasSwipedBefore.data?.hasSwipedBefore === false) {
      // If the user has swiped before, we can fetch the next set of opportunities
      console.log("User has not swiped before, showing tutorial");
      setShowTutorial(true);
    } else {
      console.log("User has swiped");
      setShowTutorial(false);
    }
  }, [hasSwipedBefore.data]);

  return (
    <>
      <SwipeCardWrapper
        ref={cardRef}
        onEmptyChange={(empty) => setIsEmpty(empty)}
        setShowTutorial={setShowTutorial}
      />

      {isEmpty ? null : <SwipeButtons cardRef={cardRef} />}

      <SwipeTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </>
  );
};

export default Wrapper;
