"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Cog, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface ProfileCardProps {
  userCheck: { id: string } | null;
  userCount?: {
    liked: number;
    saved: number;
    clicked: number;
    applied: number;
    viewed: number;
  } | null;

  vertical?: boolean;
}

const ProfileCard = ({ userCheck, userCount }: ProfileCardProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const [userCountData, setUserCountData] = useState({
    viewed: 0,
    saved: 0,
    liked: 0,
    applied: 0,
    clicked: 0,
  });

  useEffect(() => {
    if (userCount) {
      setUserCountData(userCount);
    }
  }, [userCount]);
  // Manual state management

  const [profileData, setProfileData] = useState<
    typeof userCheck | null | undefined
  >(undefined);

  // Handle session state changes
  useEffect(() => {
    if (status === "unauthenticated") {
      return router.push("/api/auth/signin");
    }
  }, [status, session?.user?.id, router]);

  useEffect(() => {
    if (userCheck == null) {
      return router.replace("/new-user");
    }
  }, [userCheck]);

  // Other queries - only run when we have a profile
  const { data: userData, isLoading: isLoadingTeleUser } =
    api.user.getUserData.useQuery(undefined, {
      enabled: !!userCheck?.id,
    });

  // const { data: userCountData } = api.userOpp.getUserOppMetricCounts.useQuery(
  //   undefined,
  //   {
  //     enabled: !!userCheck?.id,
  //   },
  // );

  // Don't render if not authenticated or no profile
  if (!session?.user || !userCheck?.id) {
    return null;
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
    <div className="shadow-brand flex h-full w-full flex-col rounded-xl border-2 bg-white p-6">
      <div className="bg-primary h-36 w-full rounded-t-md border-2"></div>

      {/* Main content area with profile picture overlapping */}
      <div className={`relative flex flex-col gap-4 p-4 pt-16 md:p-8`}>
        {/* Profile picture positioned to overlap colored section */}
        <div
          className={`absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 rounded-full border-2 md:-top-16 md:right-8 md:translate-x-0 md:translate-y-0`}
        >
          <Avatar
            className={`aspect-square h-44 w-44 border-4 border-white bg-white shadow md:h-48 md:w-48`}
          >
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
        <div className={`mt-8 w-full space-y-2 md:-my-4`}>
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
          {userCount && (
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
          )}

          <div className="mt-4 flex w-full justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="btn-brand-white -mr-4">
                <Cog size={24} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="border-2 font-medium"
                sideOffset={10}
              >
                <DropdownMenuItem asChild>
                  <Link className="text-red" href="/api/auth/signout">
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {userData?.id && (
        <div
          className="relative mt-1 flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-500"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setCopied(false);
          }}
          onClick={() => {
            void navigator.clipboard.writeText(userData.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 500);
          }}
        >
          <span className="font-medium opacity-50">ID: {userData.id}</span>

          {/* Animate icon based on hover or copied state */}
          <AnimatePresence>
            {(hovered || copied) && (
              <motion.div
                key={copied ? "check" : "copy"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="ml-1 text-gray-400"
              >
                {copied ? "Copied!" : <Copy size={16} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
