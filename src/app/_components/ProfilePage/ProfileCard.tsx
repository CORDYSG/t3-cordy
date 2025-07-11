"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Cog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTelegramAuth?: (user: any) => void;
  }
}

const ProfileCard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [hasDoneUserProfileCheck, setHasDoneUserProfileCheck] = useState(true);
  const [showTelegramLogin, setShowTelegramLogin] = useState(false);

  // All hooks must be called before any conditional logic
  const userCheck = api.user.getUserProfile.useQuery(undefined, {
    enabled: status === "authenticated" && !!session?.user,
  });

  const { data: userData, isLoading: isLoadingTeleUser } =
    api.user.getUserData.useQuery();

  const { data: userCountData } = api.userOpp.getUserOppMetricCounts.useQuery();

  // // Telegram login widget setup
  // useEffect(() => {
  //   // Define global function for Telegram auth
  //   window.onTelegramAuth = function (user: any) {
  //     fetch("/api/auth/telegram", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(user),
  //     }).then(() => {
  //       window.location.href = "/profile";
  //     });
  //   };

  //   // Load Telegram login widget when needed
  //   if (showTelegramLogin) {
  //     const script = document.createElement("script");
  //     script.src = "https://telegram.org/js/telegram-widget.js?22";
  //     script.async = true;
  //     script.setAttribute("data-telegram-login", "cordy_sandbot"); // no "@"
  //     script.setAttribute("data-size", "large");
  //     script.setAttribute("data-userpic", "true");
  //     script.setAttribute("data-request-access", "write");
  //     script.setAttribute("data-onauth", "onTelegramAuth(user)");

  //     const telegramButton = document.getElementById("telegram-button");
  //     if (telegramButton) {
  //       // Clear existing content
  //       telegramButton.innerHTML = "";
  //       telegramButton.appendChild(script);
  //     }
  //   }
  // }, [showTelegramLogin]);

  useEffect(() => {
    // Wait for session + tRPC result
    if (status === "authenticated") {
      if (userCheck.status === "success") {
        if (!userCheck.data?.id) {
          setHasDoneUserProfileCheck(false);
          router.replace("/new-user");
        } else {
          setHasDoneUserProfileCheck(true);
        }
      }
    }
  }, [status, userCheck.status, userCheck.data, router]);

  // Handle redirect after all hooks are called
  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && !session?.user)
    ) {
      router.push("/api/auth/signin");
    }
  }, [status, session, router]);

  // Early return after all hooks
  if (!session?.user) {
    router.push("/api/auth/signin");
    return null; // or a loading state
  }

  const userInitials = session.user.name
    ? session.user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
    : "U";

  return (
    <div className="shadow-brand flex w-full flex-col rounded-xl border-2 bg-white p-6">
      <div className="bg-primary h-36 w-full rounded-t-md border-2"></div>

      {/* Main content area with profile picture overlapping */}
      <div className="relative flex flex-col gap-4 p-4 pt-16 md:p-8">
        {/* Profile picture positioned to overlap colored section */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 rounded-full border-2 md:-top-16 md:right-8 md:translate-x-0 md:translate-y-0">
          <Avatar className="aspect-square h-44 w-44 border-4 border-white bg-white shadow md:h-48 md:w-48">
            <AvatarImage
              src={
                session?.user.image ??
                "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
              }
              alt={session?.user.name ?? "User"}
              className=""
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </div>

        {/* User information */}
        <div className="mt-8 w-full space-y-2 md:-my-4">
          <h2 className="skeleton text-5xl font-bold">{session?.user.name}</h2>
          <div>
            <p className="font-medium">{session?.user.email}</p>
            {isLoadingTeleUser ? (
              <Skeleton className="mt-1 h-4 w-2/3" />
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <p className="text-sm font-normal text-gray-500">
                    Telegram ID: {userData?.teleUserHandle ?? "Not linked"}
                  </p>
                </TooltipTrigger>
                <TooltipContent side={"right"}>Coming soon!</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Stats section */}
          <div className="mt-5 flex w-full justify-center gap-4 md:my-5">
            <div className="flex flex-col items-center">
              <p className="text-accent-blue text-2xl font-bold">
                {userCountData?.viewed ?? 0}
              </p>
              <p className="text-sm text-gray-500">Viewed</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-accent-green text-2xl font-bold">
                {userCountData?.saved ?? 0}
              </p>
              <p className="text-sm text-gray-500">Saved</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-accent-magenta text-2xl font-bold">
                {userCountData?.liked ?? 0}
              </p>
              <p className="text-sm text-gray-500">Liked</p>
            </div>
          </div>
          <div className="mt-4 flex w-full justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="btn-brand-white -mr-4">
                <Cog size={24} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="border-2 font-medium"
                sideOffset={10}
              >
                {/* <DropdownMenuItem
                  onClick={() => setShowTelegramLogin(true)}
                  disabled={!!userData?.telegramId}
                >
                  {userData?.telegramId ? "Telegram Linked" : "Link Telegram"}
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild>
                  <Link className="text-red" href="/api/auth/signout">
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Telegram login widget container */}
          {/* {showTelegramLogin && !userData?.telegramId && (
            <div className="mt-4 flex w-full justify-center">
              <div className="rounded-lg border-2 border-gray-200 p-4">
                <p className="mb-3 text-center text-sm font-medium">
                  Click the button below to link your Telegram account:
                </p>
                <div id="telegram-button" className="flex justify-center"></div>
                <button
                  onClick={() => setShowTelegramLogin(false)}
                  className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )} */}

          {!hasDoneUserProfileCheck && (
            <div className="mt-4 flex w-full justify-center">
              <Link
                className="btn-brand-primary flex items-center gap-2 text-sm"
                href={"/new-user"}
              >
                <X size={24} />
                <span> You have not done your profiling!</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
