"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import CordyLogo from "./CordyLogo";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-muted h-auto w-full px-8 py-8 pt-16 lg:pt-8">
      <div className="container mx-auto flex w-11/12 items-start justify-between">
        {/* Left side - Links */}
        <div className="flex flex-col space-y-4">
          <div className="flex-shrink-0">
            <CordyLogo fixWidth />
            <p className="text-md mt-4 font-bold text-white uppercase md:text-xl">
              YOUTH-LED NON-PROFIT
            </p>
          </div>

          <Link
            href="https://www.tiktok.com/@cordy.sg?lang=en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300"
          >
            Tiktok
          </Link>
          <Link
            href="https://www.instagram.com/cordy.sg/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300"
          >
            Instagram
          </Link>
          <Link href="/feedback" className="text-white hover:text-gray-300">
            Feedback
          </Link>
        </div>

        {/* Right side - Image placeholder */}
        <button
          className="h-full cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
          onClick={() => {
            window.open(
              "https://t.me/CordySGBot?start=64943e76d32eee6db0007ad5",
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          <div className="h-48 md:h-64">
            <Image
              src={
                "https://images.ctfassets.net/ayry21z1dzn2/SthGsukLcIXbhHh0LLzsY/1114cbf3105edafa9672179070ebc73a/CORDY_Phone_Blue.svg"
              }
              alt="Cordy Phone"
              width={128}
              height={128}
              className="h-full w-full"
            />
          </div>
          <p className="my-4 text-center text-sm font-bold text-white uppercase md:text-lg">
            GET CORDY IN <br /> YOUR PHONE!
          </p>
        </button>
      </div>
      <div className="mt-2">
        <p className="text-center text-white italic opacity-60">
          &quot;Caution: This website may contain traces of bugs, experimental
          features, and the occasional existential crisis. We&apos;re working on
          it!&quot; - Team CORDY
        </p>
      </div>
    </footer>
  );
};

export default Footer;
