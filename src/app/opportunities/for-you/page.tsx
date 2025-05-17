import Image from "next/image";
import { type Metadata } from "next";

import Wrapper from "@/app/_components/Swipe/Wrapper";

// Define metadata for the page (Next.js 13+ approach)
export const metadata: Metadata = {
  title: "For You - Personalized Opportunities | YourApp",
  description:
    "Discover personalized opportunities tailored to your interests and preferences. Swipe to find your next perfect match.",
  keywords: "opportunities, personalized recommendations, swipe cards",
  // OpenGraph tags for better social sharing
  openGraph: {
    title: "For You - Personalized Opportunities",
    description:
      "Discover personalized opportunities tailored just for you. Swipe to find your next perfect match.",
    images: [
      {
        url: "https://images.ctfassets.net/ayry21z1dzn2/1sbtihkTXqSQpJwAZJYGL0/e98a51c196797dd5248e2ffbb34011d3/CORDY_Couch_Smile.svg",
        width: 400,
        height: 400,
        alt: "Cordy mascot illustration",
      },
    ],
  },
};

export type SwipeAction = {
  card: OpportunityType; // Store the full opportunity object instead of just ID
  direction: "left" | "right";
  timestamp: number;
  undone: boolean;
};

const ForYouPage = () => {
  return (
    <>
      <main className="flex w-[100vw] flex-col items-center overflow-hidden">
        <h1 className="sr-only">Personalized Opportunities For You</h1>

        <section aria-label="Opportunity Cards" className="w-full">
          <Wrapper />
        </section>

        {/* Structured data for better search engine understanding */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "For You - Personalized Opportunities",
              description:
                "Discover personalized opportunities tailored to your interests and preferences.",
              image:
                "https://images.ctfassets.net/ayry21z1dzn2/1sbtihkTXqSQpJwAZJYGL0/e98a51c196797dd5248e2ffbb34011d3/CORDY_Couch_Smile.svg",
            }),
          }}
        />
      </main>
      <div className="relative mx-auto mt-12 flex h-24 w-2/3 items-center justify-center md:h-46 md:w-full">
        <Image
          src={
            "https://images.ctfassets.net/ayry21z1dzn2/1sbtihkTXqSQpJwAZJYGL0/e98a51c196797dd5248e2ffbb34011d3/CORDY_Couch_Smile.svg"
          }
          width={400}
          height={400}
          alt="Cordy mascot relaxing on a couch with a friendly smile"
          className=""
          priority
        />
      </div>
    </>
  );
};

export default ForYouPage;
