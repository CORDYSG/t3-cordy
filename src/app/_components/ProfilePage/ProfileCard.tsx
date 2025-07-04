"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { LogOutIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ProfileCard = () => {
  const router = useRouter();
  const { data: session } = useSession();

  if (!session?.user) {
    router.push("/api/auth/signin");
    return null; // or a loading state
  }

  const { data: userData, isLoading: isLoadingTeleUser } =
    api.user.getUserData.useQuery();

  const { data: userCountData } = api.userOpp.getUserOppMetricCounts.useQuery();

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
      {/* Colored header section */}

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
              <p className="text-sm font-normal text-gray-500">
                Telegram ID: {userData?.telegramId ?? "Not linked"}
              </p>
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
            <Tooltip>
              <TooltipTrigger>
                <Link href="api/auth/signout" className="btn-brand-white -mr-4">
                  {" "}
                  <span className="hidden md:block">Log out</span>
                  <LogOutIcon size={24} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Log out</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
