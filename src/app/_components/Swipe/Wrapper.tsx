"use client";

import { useRef, useState } from "react";
import SwipeCardWrapper from "@/app/_components/Swipe/SwipeCardWrapper";

import SwipeButtons from "@/app/_components/Swipe/SwipeButtons";
type SwipeWrapperRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
  empty: boolean;
};

const Wrapper = () => {
  const cardRef = useRef<SwipeWrapperRef>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  return (
    <>
      <SwipeCardWrapper
        ref={cardRef}
        onEmptyChange={(empty) => setIsEmpty(empty)}
      />
      {isEmpty ? null : <SwipeButtons cardRef={cardRef} />}
    </>
  );
};

export default Wrapper;
