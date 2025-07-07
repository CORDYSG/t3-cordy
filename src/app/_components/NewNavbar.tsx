"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GalaxyLidIndicator from "./GalaxyLid";
import CordyLogo from "./CordyLogo";

interface NavbarProps {
  session?: Session | null;
}

const NewNavbar: React.FC<NavbarProps> = ({ session }) => {
  const pathName = usePathname();
  const segments = pathName.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";

  // Determine active tab
  const isForYouActive = lastSegment.startsWith("for-you");
  const isAllActive =
    lastSegment.startsWith("opportunities") &&
    !lastSegment.startsWith("for-you");

  // Refs for measuring tab widths
  const forYouRef = useRef<HTMLAnchorElement>(null);
  const allRef = useRef<HTMLAnchorElement>(null);
  const [tabDimensions, setTabDimensions] = useState({
    forYouWidth: 0,
    allWidth: 0,
    forYouOffset: 0,
    allOffset: 0,
  });

  useEffect(() => {
    if (forYouRef.current && allRef.current) {
      const forYouRect = forYouRef.current.getBoundingClientRect();
      const allRect = allRef.current.getBoundingClientRect();
      const containerRect =
        forYouRef.current.parentElement?.getBoundingClientRect();

      if (containerRect) {
        setTabDimensions({
          forYouWidth: forYouRect.width,
          allWidth: allRect.width,
          forYouOffset: forYouRect.left - containerRect.left,
          allOffset: allRect.left - containerRect.left,
        });
      }
    }
  }, [pathName]);

  let userInitials = "U";

  if (session?.user) {
    const username = session.user.name ?? "User";
    const words = username.trim().split(/\s+/);

    userInitials = words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: "#fffbf4" }}
    >
      <div>
        <div className="relative container mx-auto mb-2 flex items-center justify-between px-4 py-5 md:mb-2 md:px-4 lg:px-8">
          <div className="hidden md:block">
            <p className="font-brand text-xl font-extrabold uppercase opacity-55">
              LOCATION: SG
            </p>
          </div>
          <div className="block md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
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
          <div className="shadow-brand relative flex overflow-hidden rounded-full border-2 bg-white">
            {/* Animated background pill */}
            <motion.div
              className={`absolute inset-y-0 cursor-pointer rounded-full ${isAllActive || isForYouActive ? "bg-gray-400 outline-2 outline-black" : ""}`}
              initial={false}
              animate={{
                x: isForYouActive ? 0 : tabDimensions.allOffset,
                width: isForYouActive
                  ? tabDimensions.forYouWidth
                  : tabDimensions.allWidth,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />

            <Link
              ref={forYouRef}
              href="/opportunities/for-you"
              className="relative z-10 px-4 py-1 text-center text-sm font-bold whitespace-nowrap uppercase transition-colors duration-200 hover:cursor-pointer"
            >
              <span
                className={`font-brand relative z-10 font-black transition-colors duration-200 ${
                  isForYouActive
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                For You
              </span>
            </Link>
            {!isAllActive && !isForYouActive && (
              <div className="h-full border-l-2 pr-1" />
            )}

            <Link
              ref={allRef}
              href="/opportunities"
              className="relative z-10 rounded-full px-4 py-1 text-center text-sm font-bold whitespace-nowrap uppercase transition-colors duration-200"
            >
              <span
                className={`font-brand relative z-10 font-black transition-colors duration-200 ${
                  isAllActive
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NewNavbar;
