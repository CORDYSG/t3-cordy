"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { FaTelegramPlane } from "react-icons/fa";
import type { Session } from "next-auth";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
interface NavbarProps {
  session?: Session | null;
}

const Navbar: React.FC<NavbarProps> = ({ session }) => {
  const pathName = usePathname();
  const segments = pathName.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";
  const [open, setOpen] = useState(false); // 👈 track open state

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
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="drawer-content flex flex-col">
        <nav className="sticky top-0 w-full">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex-shrink-0">
                <Link
                  href="/"
                  className="bg-primary font-brand rounded-full px-4 py-1 align-baseline text-2xl font-extrabold text-white uppercase"
                >
                  Cordy
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:block lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
                <div className="flex items-baseline space-x-4 uppercase">
                  <Link
                    href="/opportunities/for-you"
                    className={`group active:text-primary-active hover:text-primary underline-indicator relative rounded-md px-3 py-2 text-sm font-semibold ${lastSegment.startsWith("for-you") ? "text-primary underline-indicator-active" : "text-text"}`}
                  >
                    For You
                  </Link>
                  <Link
                    href="/opportunities"
                    className={`group active:text-primary-active hover:text-primary underline-indicator relative rounded-md px-3 py-2 text-sm font-semibold ${lastSegment.startsWith("opportunities") ? "text-primary underline-indicator-active" : "text-text"}`}
                  >
                    Opportunities
                  </Link>
                </div>
              </div>

              {/* User Section */}
              <div className="ml-4 hidden items-center gap-4 md:ml-6 md:flex">
                {session ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Avatar>
                        <AvatarImage
                          src={
                            session.user.image ??
                            "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
                          }
                          alt={session.user.name ?? "User"}
                        />
                        <AvatarFallback>{userInitials} </AvatarFallback>
                      </Avatar>
                    </PopoverTrigger>
                    <PopoverContent
                      className="mt-3 flex w-fit flex-col items-center justify-center p-0"
                      style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
                    >
                      <Link
                        href="/profile"
                        className="w-full cursor-pointer rounded-t-md border-b-1 p-3 text-left hover:bg-slate-100"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/api/auth/signout"
                        className="w-full cursor-pointer rounded-b-md p-3 text-left text-red-700 hover:bg-slate-100"
                      >
                        Log Out
                      </Link>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Link href="/api/auth/signin">
                    <button className="btn-brand-primary text-sm uppercase">
                      Sign in
                    </button>
                  </Link>
                )}

                <button
                  type="button"
                  className="btn-brand-blue hidden text-sm uppercase md:block"
                  onClick={() => {
                    window.open(
                      "https://t.me/CordySGBot?start=64943e76d32eee6db0007ad5",
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                >
                  Get cordy in Telegram
                </button>
                <button
                  type="button"
                  className="btn-brand-blue rounded-full text-sm uppercase md:hidden"
                >
                  <FaTelegramPlane
                    size={16}
                    color="white"
                    strokeWidth={4}
                    stroke="#000000"
                  />
                </button>
              </div>
              <SheetTrigger asChild className="md:hidden">
                <div className="btn-icon">
                  {" "}
                  <Menu size={24} className="" />
                </div>
              </SheetTrigger>
            </div>
          </div>
        </nav>
      </div>

      <SheetContent>
        <SheetTitle className="hidden">Menu</SheetTitle>
        <div className="bg-background flex h-full w-full flex-col border-l-2">
          <div className="flex flex-grow flex-col items-center gap-4 p-7">
            <div className="space-y-2">
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
              {session ? (
                <div className="text-center font-bold">
                  {session?.user.name}
                </div>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="w-full outline-none"
                  onClick={() => setOpen(false)}
                >
                  <button className="btn-brand-primary my-4 w-full text-sm uppercase">
                    Sign in
                  </button>
                </Link>
              )}
            </div>
            <div className="w-full border-b-2 border-dashed border-black"></div>
            <ul className="font-medium">
              <li className="mb-4">
                <Link
                  href="/opportunities/for-you"
                  className={`active:text-primary-active hover:text-primary rounded-md px-3 py-2 text-sm font-semibold ${lastSegment.startsWith("for-you") ? "text-primary" : "text-text"}`}
                  onClick={() => setOpen(false)}
                >
                  For You
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/opportunities"
                  className={`active:text-primary-active hover:text-primary rounded-md px-3 py-2 text-sm font-semibold ${lastSegment.startsWith("opportunities") ? "text-primary" : "text-text"}`}
                  onClick={() => setOpen(false)}
                >
                  Opportunities
                </Link>
              </li>
              {session && (
                <li className="mb-4">
                  <Link
                    href="/profile"
                    className={`active:text-primary-active hover:text-primary rounded-md px-3 py-2 text-sm font-semibold ${lastSegment.startsWith("opportunities") ? "text-primary" : "text-text"}`}
                    onClick={() => setOpen(false)}
                  >
                    Profile
                  </Link>
                </li>
              )}
              {/* {session && ( 
                <li className="mb-4">
                  <Link
                    href="/profile"
                    className={`active:text-primary-active hover:text-primary rounded-md px-3 py-2 text-sm font-semibold ${lastSegment.startsWith("profile") ? "text-primary" : "text-text"}`}
                    onClick={() => setOpen(false)}
                  >
                    Profile
                  </Link>
                </li>
              )} */}
            </ul>

            {/* 👇 This pushes it to the bottom */}
            <div className="mt-auto flex w-full flex-col text-center">
              {session && (
                <Link href="/api/auth/signout" className="w-full">
                  <button className="btn-brand-primary my-4 w-full text-sm uppercase">
                    Log Out
                  </button>
                </Link>
              )}
              <button
                type="button"
                className="btn-brand-blue w-full text-xs uppercase"
                onClick={() => {
                  window.open(
                    "https://t.me/CordySGBot?start=64943e76d32eee6db0007ad5",
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                Telegram
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Navbar;
