"use client";

import { usePathname } from "next/navigation";
import NewNavbar from "./NewNavbar";
import CommunityNavbar from "./CommunityNavbar";
import type { Session } from "next-auth";

interface NavbarWrapperProps {
  session?: Session | null; // Replace with your actual session type
}

export default function NavbarWrapper({ session }: NavbarWrapperProps) {
  const pathName = usePathname();
  const segments = pathName.split("/").filter(Boolean);
  const lastSegment = segments[0] ?? "";
  const isOnCommunityPage = lastSegment == "c";

  return isOnCommunityPage ? (
    <CommunityNavbar session={session} />
  ) : (
    <NewNavbar session={session} />
  );
}
