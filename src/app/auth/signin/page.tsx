// app/auth/signin/page.tsx

"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Extend the Window interface to include onTelegramAuth

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
  [key: string]: unknown;
}
declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "That email is already linked with another provider. Please use the originally linked sign-in method.",
    // Add other custom errors if needed
  };

  //   useEffect(() => {
  //     // Define global function for Telegram auth
  //     window.onTelegramAuth = function (user: any) {
  //       fetch("/api/auth/telegram", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(user),
  //       }).then(() => {
  //         window.location.href = "/user-check";
  //       });
  //     };

  //     // Load Telegram login widget
  //     const script = document.createElement("script");
  //     script.src = "https://telegram.org/js/telegram-widget.js?22";
  //     script.async = true;
  //     script.setAttribute("data-telegram-login", "cordy_sandbot"); // no "@"
  //     script.setAttribute("data-size", "large");
  //     script.setAttribute("data-userpic", "true");
  //     script.setAttribute("data-request-access", "write");
  //     script.setAttribute("data-onauth", "onTelegramAuth(user)");
  //     document.getElementById("telegram-button")?.appendChild(script);
  //   }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="grid w-full max-w-5xl grid-cols-1 md:grid-cols-2">
        {/* Left Side - Image */}
        <div className="relative flex items-center justify-center p-4">
          <Image
            src="https://images.ctfassets.net/ayry21z1dzn2/2NvR9tmn5FgVbrAgoZocXF/31df9addaf2aaa8eacab3534cd886720/CORDY_Mic_5.svg"
            alt="Cordy Mic"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>

        {/* Right Side - Login Box */}
        <div className="flex flex-col justify-center rounded-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-brand mb-6 text-3xl font-extrabold text-black">
            Sign in to CORDY
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
              className="w-full rounded-lg border-4 border-black bg-white py-3 font-bold text-black shadow-[4px_4px_0px_0px_black] transition-all hover:bg-gray-100"
            >
              Sign in with Google
            </button>

            <button
              onClick={() => signIn("discord")}
              className="w-full rounded-lg border-4 border-black bg-indigo-400 py-3 font-bold text-white shadow-[4px_4px_0px_0px_black] transition-all hover:bg-indigo-500"
            >
              Sign in with Discord
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
