import SwipeCardWrapper from "@/app/_components/Swipe/SwipeCardWrapper";
import { api } from "@/trpc/server";
import Image from "next/image";

export type SwipeAction = {
  card: OpportunityType; // Store the full opportunity object instead of just ID
  direction: "left" | "right";
  timestamp: number;
  undone: boolean;
};

const ForYouPage = () => {
  return (
    <div className="flex w-full flex-col items-center">
      <SwipeCardWrapper />
      <div className="relative mx-auto mt-32 flex h-24 w-2/3 items-center justify-center md:h-40 md:w-full">
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

export default ForYouPage;
