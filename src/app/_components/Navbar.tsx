"use client";

import Link from "next/link";
import { Menu, UserCircle } from "lucide-react";

import { FaTelegramPlane } from "react-icons/fa";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
    <Sheet>
      <div className="drawer-content flex flex-col">
        <nav className="sticky top-0 w-full">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link
                  href="/"
                  className="bg-primary font-brand rounded-full px-4 py-1 text-2xl font-bold text-white uppercase"
                >
                  Cordy
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:block lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
                <div className="flex items-baseline space-x-4 uppercase">
                  <Link
                    href="/opportunities/for-you"
                    className="text-text active:text-primary hover:text-primary rounded-md px-3 py-2 text-sm font-semibold"
                  >
                    For You
                  </Link>
                  <Link
                    href="/opportunities"
                    className="text-text active:text-primary hover:text-primary rounded-md px-3 py-2 text-sm font-semibold"
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
                          src={session.user.image ?? "/default-avatar.png"}
                          alt={session.user.name ?? "User"}
                        />
                        <AvatarFallback>{userInitials} </AvatarFallback>
                      </Avatar>
                    </PopoverTrigger>
                    <PopoverContent className="mt-3 flex w-fit items-center justify-center p-3">
                      <Link href="/api/auth/signout">
                        <button className="btn-brand-primary text-sm uppercase">
                          Log Out
                        </button>
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
                    src={session?.user.image ?? "/default-avatar.png"}
                    alt={session?.user.name ?? "User"}
                  />

                  <AvatarFallback>{userInitials} </AvatarFallback>
                </Avatar>
              </div>
              {session ? (
                <div className="text-center font-semibold">
                  {session?.user.name}
                </div>
              ) : (
                <Link href="/api/auth/signin" className="w-full outline-none">
                  <button className="btn-brand-primary my-4 w-full text-sm uppercase">
                    Sign in
                  </button>
                </Link>
              )}
            </div>
            <div className="h-[0.5px] w-full bg-black"></div>
            <ul className="font-medium">
              <li className="mb-4">
                <Link
                  href="/opportunities/for-you"
                  className="hover:text-primary text-black"
                >
                  For You
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/opportunities"
                  className="hover:text-primary text-black"
                >
                  Opportunities
                </Link>
              </li>
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
