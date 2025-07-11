"use client";
import Link from "next/link";
import React from "react";

interface CordyLogoProps {
  fixWidth?: boolean;
}

const CordyLogo: React.FC<CordyLogoProps> = ({
  fixWidth = false,
}: CordyLogoProps) => (
  <div className="block">
    <div className={`flex-shrink-0 ${fixWidth ? "w-40" : "w-auto"}`}>
      <Link
        href="/opportunities/for-you"
        className={`bg-primary font-logo flex items-center justify-center rounded-full px-4 pt-1 text-center align-baseline text-2xl font-black text-white uppercase md:px-8 md:text-3xl`}
      >
        Cordy
      </Link>
    </div>
  </div>
);

export default CordyLogo;
