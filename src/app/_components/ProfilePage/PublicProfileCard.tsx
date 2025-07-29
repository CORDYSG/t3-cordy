/* eslint-disable  @typescript-eslint/no-explicit-any*/
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useEffect, useState } from "react";

interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  lastActive: Date | null;
  image: string | null;
}

interface ProfileCardProps {
  user: UserData | null;
  userCount?: {
    liked: number;
    saved: number;
    clicked: number;
    applied: number;
    viewed: number;
  } | null;
  vertical?: boolean;
}

const PublicProfileCard = ({ user, userCount }: ProfileCardProps) => {
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

  if (!user?.id) return null;

  const userInitials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
    : "U";

  return (
    <div className="shadow-brand flex h-full w-full flex-col rounded-xl border-2 bg-white p-6">
      <div className="bg-primary h-36 w-full rounded-t-md border-2"></div>

      <div className="relative flex flex-col gap-4 p-4 pt-16 md:p-8">
        <div
          className={`absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 rounded-full border-2 md:-top-16 md:right-8 md:translate-x-0 md:translate-y-0`}
        >
          <Avatar
            className={`aspect-square h-44 w-44 border-4 border-white bg-white shadow md:h-48 md:w-48`}
          >
            <AvatarImage
              src={
                user?.image ??
                "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
              }
              alt={user?.name ?? "User"}
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </div>

        <div className={`mt-8 w-full space-y-2 md:-my-4`}>
          <h2 className="text-5xl font-bold">{user?.name ?? "CORDY User"}</h2>

          {userCount && (
            <div className="mt-5 flex w-full justify-center gap-4 md:my-5">
              <div className="flex flex-col items-center">
                <p className="text-accent-blue text-2xl font-bold">
                  {userCountData.viewed}
                </p>
                <p className="text-sm text-gray-500">Viewed</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-accent-green text-2xl font-bold">
                  {userCountData.saved}
                </p>
                <p className="text-sm text-gray-500">Saved</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-accent-magenta text-2xl font-bold">
                  {userCountData.liked}
                </p>
                <p className="text-sm text-gray-500">Liked</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfileCard;
