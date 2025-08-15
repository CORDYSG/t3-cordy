"use client";

import { useEffect, useRef, useState } from "react";

import SwipeCardWrapper from "@/app/_components/Swipe/SwipeCardWrapper";

import SwipeButtons from "@/app/_components/Swipe/SwipeButtons";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import LoginPopup from "../LoginModal";

import SwipeTutorialModal from "./SwipeModal";
import { useGuest } from "@/contexts/GuestContext";

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
  const [swipeCount, setSwipeCount] = useState(0);
  const [hasShownLogin, setHasShownLogin] = useState(false); // NEW

  const { guestId, guestHistory, isGuest } = useGuest();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const hasSwipedBefore = api.userOpp.hasSwipedBefore.useQuery({
    guestId: guestId ?? "",
  });

  // Track swipes for guests
  useEffect(() => {
    if (!isAuthenticated) {
      setSwipeCount(guestHistory.seenOppIds.length);
    }
  }, [guestHistory.seenOppIds.length, isAuthenticated]);

  // Initial tutorial/login logic
  useEffect(() => {
    if (hasSwipedBefore.isLoading || guestId === undefined) return;

    if (isAuthenticated) {
      if (hasSwipedBefore.data?.hasSwipedBefore === false) {
        setShowTutorial(true);
      } else {
        setShowTutorial(false);
      }
      setShowLogin(false);
    } else {
      const hasSeenHistory = guestHistory.seenOppIds.length > 0;
      if (!hasSeenHistory) {
        setShowTutorial(true);
      } else if (!hasShownLogin) {
        // Only on first load
        setShowLogin(true);
        setHasShownLogin(true);
      }
    }
  }, [
    isAuthenticated,
    guestId,
    guestHistory.seenOppIds.length,
    hasSwipedBefore.data,
    hasSwipedBefore.isLoading,
    hasShownLogin, // dependency for flag
  ]);

  // Show login after 3 swipes if not already shown
  useEffect(() => {
    if (!isAuthenticated && swipeCount >= 2 && !hasShownLogin) {
      setShowLogin(true);
      setHasShownLogin(true);
    }
  }, [swipeCount, isAuthenticated, hasShownLogin]);

  const handleSetShowTutorial = (show: boolean) => {
    setShowTutorial(show);
    if (!show && !isAuthenticated && !hasShownLogin) {
      setShowLogin(true);
      setHasShownLogin(true);
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
