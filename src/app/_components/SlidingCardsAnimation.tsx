"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SlidingCards from "@/app/_components/SlidingCardsAnimation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "That email is already linked with another provider. Please use the originally linked sign-in method.",
  };

  return (
    <main className="bg-primary min-h-screen w-full [touch-action:manipulation] overflow-hidden">
      {/* Game Container with fixed aspect ratio */}
      <div className="game-container">
        {/* Animated Sliding Cards Background */}
        <div className="absolute inset-0 z-0">
          <SlidingCards />
        </div>

        {/* Sign-In Card - Game-style absolute positioning */}
        <motion.div
          initial={{ x: 200, rotate: 0, opacity: 1 }}
          animate={{ x: 0, rotate: -10, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 60,
          }}
          className="absolute z-10 w-96 rounded-2xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          style={{
            top: "50%",
            right: "10%",
            transform: "translateY(-50%) rotate(-10deg)",
          }}
        >
          <div className="bg-accent-yellow h-32 w-full rounded-2xl border-4" />

          <h1 className="font-brand my-6 text-3xl font-extrabold text-black">
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
              className="w-full cursor-pointer rounded-lg border-4 border-black bg-white py-3 font-bold text-black shadow-[4px_4px_0px_0px_black] transition-all hover:bg-gray-100"
            >
              Sign in with Google
            </button>

            <button
              onClick={() => signIn("discord")}
              className="w-full cursor-pointer rounded-lg border-4 border-black bg-indigo-400 py-3 font-bold text-white shadow-[4px_4px_0px_0px_black] transition-all hover:bg-indigo-500"
            >
              Sign in with Discord
            </button>
          </div>
        </motion.div>

        {/* Mobile background card */}
        <motion.div
          initial={{ x: 200, rotate: 0, opacity: 1 }}
          animate={{ x: 0, rotate: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 300,
            damping: 60,
          }}
          className="absolute z-0 h-96 w-80 rounded-2xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:hidden"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="bg-accent-magenta h-32 w-full rounded-2xl border-4" />
        </motion.div>
      </div>

      <style jsx>{`
        .game-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          height: 100vh;
          max-width: 177.78vh; /* 16:9 aspect ratio - 16/9 * 100vh */
          max-height: 56.25vw; /* 16:9 aspect ratio - 9/16 * 100vw */
          aspect-ratio: 16/9;
          transform-origin: center;
          background: inherit;
        }

        /* Alternative for different aspect ratios */
        @media (max-aspect-ratio: 16/9) {
          .game-container {
            width: 177.78vh; /* Scale based on height */
            height: 100vh;
          }
        }

        @media (min-aspect-ratio: 16/9) {
          .game-container {
            width: 100vw;
            height: 56.25vw; /* Scale based on width */
          }
        }
      `}</style>
    </main>
  );
}
