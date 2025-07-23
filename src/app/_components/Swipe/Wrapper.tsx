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

  const {
    guestId,
    guestHistory,

    isGuest,
  } = useGuestId();

  const { data: session } = useSession();

  const isAuthenticated = !!session?.user;

  const hasSwipedBefore = api.userOpp.hasSwipedBefore.useQuery({
    guestId: guestId ?? "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      // User is authenticated
      setShowTutorial(false);
    } else if (isGuest && guestId) {
    }
  }, [isAuthenticated, isGuest, guestId, guestHistory]);
  useEffect(() => {
    if (hasSwipedBefore.data?.hasSwipedBefore === false) {
      if (guestHistory.seenOppIds.length == 0) {
        setShowTutorial(true);
      } else {
        setShowTutorial(false);
      }
      // If the user has swiped before, we can fetch the next set of opportunitie
    } else {
      setShowTutorial(false);
    }
  }, [guestHistory]);

  const handleSetShowTutorial = (show: boolean) => {
    setShowTutorial(show);

    if (show == false) {
      if (!isAuthenticated) {
        setTimeout(() => setShowLogin(true), 100);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !showTutorial) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [isAuthenticated]);

  return (
    <>
      <SwipeCardWrapper
        ref={cardRef}
        onEmptyChange={(empty) => setIsEmpty(empty)}
        setShowTutorial={setShowTutorial}
        openLoginModal={() => setShowLogin(true)}
      />

      {isEmpty ? null : <SwipeButtons cardRef={cardRef} />}

      <SwipeTutorialModal
        isOpen={showTutorial}
        onClose={() => handleSetShowTutorial(false)}
      />
      <LoginPopup
        isLoginModalOpen={showLogin}
        onCloseLoginModal={() => setShowLogin(false)}
      />
    </>
  );
};

export default Wrapper;
