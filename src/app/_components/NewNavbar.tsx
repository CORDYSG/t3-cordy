"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GalaxyLidIndicator from "./GalaxyLid";

interface NavbarProps {
  session?: Session | null;
}
const NewNavbar: React.FC<NavbarProps> = ({ session }) => {
  const pathName = usePathname();
  const segments = pathName.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";
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
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="bg-primary font-brand rounded-full px-4 py-1 align-baseline text-2xl font-extrabold text-white uppercase md:px-8"
              >
                Cordy
              </Link>
            </div>
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
            <Link
              href="/opportunities/for-you"
              className={`relative z-10 px-4 py-1 text-sm font-bold uppercase transition-colors duration-200 ${
                !lastSegment.startsWith("for-you") &&
                !lastSegment.startsWith("opportunities") &&
                "border-r-2"
              }`}
            >
              {lastSegment.startsWith("for-you") && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gray-400 outline-2 outline-black"
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <span
                className={`font-brand relative z-10 font-black ${
                  lastSegment.startsWith("for-you")
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-800"
                } `}
              >
                For You
              </span>
            </Link>

            <Link
              href="/opportunities"
              className="relative z-10 rounded-full px-4 py-1 text-sm font-bold uppercase transition-colors duration-200"
            >
              {lastSegment.startsWith("opportunities") &&
                !lastSegment.startsWith("for-you") && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gray-400 outline-2 outline-black"
                    layoutId="activeTab"
                    initial={false}
                    style={{
                      boxShadow: "-2px 0 0 0 #d1d5db",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              <span
                className={`font-brand relative z-10 font-black ${
                  lastSegment.startsWith("opportunities") &&
                  !lastSegment.startsWith("for-you")
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
