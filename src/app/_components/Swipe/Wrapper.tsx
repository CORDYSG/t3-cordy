"use client";

import { useEffect, useRef, useState } from "react";

import SwipeCardWrapper from "@/app/_components/Swipe/SwipeCardWrapper";

import SwipeButtons from "@/app/_components/Swipe/SwipeButtons";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import LoginPopup from "../LoginModal";

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
  const [showLogin, setShowLogin] = useState(false);
  const [guestHistory, setGuestHistory] = useState<GuestHistory>({
    seenOppIds: [],
    likedOppIds: [],
  });
  const [guestId, setGuestId] = useState<string>("");

  const { data: session } = useSession();

  const isAuthenticated = !!session?.user;

  const hasSwipedBefore = api.userOpp.hasSwipedBefore.useQuery({
    guestId: guestId ?? "",
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
      } else {
        const newGuestId = crypto.randomUUID();
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (storedHistory) setGuestHistory(JSON.parse(storedHistory));
    }
  }, [isAuthenticated]);

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
