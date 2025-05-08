import "@/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { auth } from "@/server/auth";
import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";

export const metadata: Metadata = {
  title: "CORDY",
  description: "Find your passion. Find your opportunity.",
  icons: {
    icon: [
      { rel: "icon", url: "/favicon.ico" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/icons/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/icons/android-chrome-512x512.png",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

const fatFrank = localFont({
  src: "../../public/fonts/fonnts.com-FatFrank_Heavy.otf",
  variable: "--font-fat-frank",
  display: "swap",
  style: "normal",
  weight: "400",
  preload: true,
  fallback: ["sans-serif"],
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  // Include all weights you need - adjust based on your requirements
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  return (
    <html lang="en" className={`${dmSans.variable} ${fatFrank.variable}`}>
      <body className="w-screen overflow-x-hidden">
        <TRPCReactProvider>
          <SessionProvider session={session}>
            <Navbar session={session} />
            {children}
            <Footer />
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
};

export default RootLayout;
