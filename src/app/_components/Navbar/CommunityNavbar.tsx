"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import GalaxyLidIndicator from "../GalaxyLid";
import CordyLogo from "../CordyLogo";

interface NavbarProps {
  session?: Session | null;
}

const CommunityNavbar: React.FC<NavbarProps> = ({ session }) => {
  const pathName = usePathname();
  const segments = pathName.split("/").filter(Boolean);
  const communityName = segments[1] ?? "Community";

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: "#fffbf4" }}
    >
      <div>
        <div className="relative container mx-auto mb-2 flex items-center justify-between px-4 py-5 md:mb-2 md:px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <CordyLogo />
          </div>
          <div>
            <GalaxyLidIndicator session={session} />
          </div>
        </div>
      </div>
      <div
        className="relative w-full border-b-2"
        style={{ backgroundColor: "#fffbf4" }}
      >
        <div className="absolute -top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2">
          <div className="shadow-brand relative flex items-center overflow-hidden rounded-full border-2 bg-white">
            <p className="px-5 text-center text-sm font-bold uppercase">
              {communityName}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CommunityNavbar;
