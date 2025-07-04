"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { FaGoogle, FaDiscord } from "react-icons/fa";
import SlidingCards from "@/app/_components/SlidingCardsAnimation";
import oppCardsLottie from "../../../../public/lottie/oppCards.json";
import CordyMoveLeftRight from "../../../../public/lottie/CordyMoveLeftRight.json";
import Lottie from "lottie-react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import Image from "next/image";

// Wrap the component that uses useSearchParams in Suspense
function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "That email is already linked with another provider. Please use the originally linked sign-in method.",
  };
  const { RiveComponent } = useRive({
    src: "https://assets.ctfassets.net/ayry21z1dzn2/TPU3i28vPxEqq3Pz85L71/90466153079d1051adf888cb5975bf87/cordyidlenew.riv", // Place the file in `public/animations/`
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });
  return (
    <main
      className="bg-primary flex min-h-screen w-full overflow-hidden"
      style={{
        // If using custom vars, replace above with actual color values:
        backgroundImage: `linear-gradient(135deg, #e84855 50%, #cc2c39 50%)`, // example using yellow and darker yellow
      }}
    >
      <div className="relative w-full pt-16 md:min-h-[750px]">
        {/* Sign-In Card Container */}
        <div className="z-10 container mx-auto flex w-full items-start justify-center p-4 md:mt-24 md:min-h-[700px]">
          <motion.div
            initial={{ x: 200, rotate: 0, opacity: 1 }}
            animate={{ x: 0, rotate: -10, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 60,
            }}
            style={{ boxShadow: "8px 8px 0px 0px rgba(0, 0, 0, 1)" }}
            className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1) relative z-10 w-full max-w-md rounded-2xl border-4 border-black bg-white p-6 md:scale-150"
          >
            <div className="bg-accent-yellow relative h-32 w-full overflow-hidden rounded-2xl border-4">
              <motion.img
                src="https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
                alt="Peeking face"
                width={200}
                height={200}
                className="absolute bottom-[-40%] left-1/2 -translate-x-1/2"
                initial={{ y: 0 }}
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  times: [0, 0.4, 1], // Quick up, quick down
                  ease: ["easeOut", "easeInOut"],
                  repeat: Infinity,
                  repeatDelay: 2.2,
                }}
              />
            </div>

            <h1 className="font-brand my-6 text-3xl font-extrabold text-black md:text-4xl">
              Sign in to <span className="text-primary">CORDY</span>
            </h1>

            {error && (
              <div className="mb-4 rounded border-2 border-black bg-red-200 p-4 text-red-800 shadow-[2px_2px_0px_0px_black]">
                {errorMessages[error] ??
                  "An unexpected error occurred. Please try again."}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => signIn("google")}
                className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-lg border-4 border-black bg-white py-3 font-bold text-black shadow-[4px_4px_0px_0px_black] transition-all hover:bg-gray-100"
              >
                <FaGoogle size={20} />
                Sign in with Google
              </button>

              <button
                onClick={() => signIn("discord")}
                className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-lg border-4 border-black bg-indigo-400 py-3 font-bold text-white shadow-[4px_4px_0px_0px_black] transition-all hover:bg-indigo-500"
              >
                <FaDiscord size={20} />
                Sign in with Discord
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 200, rotate: 0, opacity: 1 }}
            animate={{ x: 0, rotate: 0, opacity: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 300,
              damping: 60,
            }}
            className="absolute h-96 w-5/6 max-w-md rounded-2xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:scale-150"
          >
            <div className="bg-accent-magenta h-32 w-full rounded-2xl border-4" />
          </motion.div>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
