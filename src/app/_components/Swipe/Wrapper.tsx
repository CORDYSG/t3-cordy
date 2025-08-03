"use client";

import { useEffect, useRef, useState } from "react";

import SwipeCardWrapper from "@/app/_components/Swipe/SwipeCardWrapper";

import SwipeButtons from "@/app/_components/Swipe/SwipeButtons";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import LoginPopup from "../LoginModal";

import SwipeTutorialModal from "./SwipeModal";
import { useGuestId } from "@/lib/guest-session";

type SwipeWrapperRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
  empty: boolean;
};

const Wrapper = () => {
  const cardRef = useRef<SwipeWrapperRef>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSwipeLogin, setShowSwipeLogin] = useState(false);

  const { guestId, guestHistory, isGuest } = useGuestId();

  const { data: session } = useSession();

  const isAuthenticated = !!session?.user;

  const hasSwipedBefore = api.userOpp.hasSwipedBefore.useQuery({
    guestId: guestId ?? "",
  });

  useEffect(() => {
    if (hasSwipedBefore.isLoading || guestId === undefined) return;

    if (isAuthenticated) {
      // Authenticated users: show tutorial only if they haven't swiped
      if (hasSwipedBefore.data?.hasSwipedBefore === false) {
        setShowTutorial(true);
      } else {
        setShowTutorial(false);
      }
      setShowLogin(false); // Never show login for auth users
    } else {
      // Guests

      const hasSeenHistory = guestHistory.seenOppIds.length > 0;
      if (!hasSeenHistory) {
        // New guest: show tutorial first
        setShowTutorial(true);
      } else {
        // Guest with history: show login immediately
        setShowLogin(true);
      }
    }
  }, [
    isAuthenticated,
    guestId,
    guestHistory,
    hasSwipedBefore.data,
    hasSwipedBefore.isLoading,
  ]);

  const handleSetShowTutorial = (show: boolean) => {
    setShowTutorial(show);

    if (!show && !isAuthenticated) {
      setShowLogin(true);
    }
  };

  return (
    <>
      <SwipeCardWrapper
        ref={cardRef}
        onEmptyChange={(empty) => setIsEmpty(empty)}
        setShowTutorial={setShowTutorial}
        openLoginModal={() => setShowLogin(true)}
        setShowSwipeLogin={() => setShowSwipeLogin(true)}
      />

      {isEmpty ? null : <SwipeButtons cardRef={cardRef} />}

      <SwipeTutorialModal
        isOpen={showTutorial}
        onClose={() => handleSetShowTutorial(false)}
      />
      <LoginPopup
        isLoginModalOpen={showLogin}
        onCloseLoginModal={() => setShowLogin(false)}
        showSwipeLogin={showSwipeLogin}
      />
    </>
  );
};

export default Wrapper;
