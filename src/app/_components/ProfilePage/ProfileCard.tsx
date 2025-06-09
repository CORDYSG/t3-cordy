"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
const ProfileCard = () => {
  const router = useRouter();
  const { data: session } = useSession();

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
    <div className="flex items-center gap-4 sm:w-full md:max-w-md">
      <div className="aspect-square w-36 rounded-full border-black bg-white">
        {" "}
        <Avatar className="aspect-square h-full w-36 border-2">
          <AvatarImage
            src={
              session?.user.image ??
              "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
            }
            alt={session?.user.name ?? "User"}
            className=""
          />

          <AvatarFallback>{userInitials} </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default ProfileCard;
