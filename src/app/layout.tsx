import "@/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans, Patrick_Hand } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { auth } from "@/server/auth";
import Navbar from "./_components/Navbar";
import NewNavbar from "./_components/NewNavbar";
import Footer from "./_components/Footer";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "@/components/ui/sonner";

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
const gilroy = localFont({
  src: [
    {
      path: "../../public/fonts/Gilroy-Light.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/Gilroy-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Gilroy-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Gilroy-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Gilroy-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/Gilroy-Heavy.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-gilroy",
  display: "swap",
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

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: ["400"],
  style: "normal",
  fallback: ["cursive"],
});

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fatFrank.variable} ${gilroy.variable} ${patrickHand.variable}`}
    >
      <body className="flex min-h-screen w-screen flex-col justify-between overflow-x-hidden">
        <TRPCReactProvider>
          <SessionProvider session={session}>
            <NewNavbar session={session} />
            <div className="min-h-48">
              {" "}
              <Suspense fallback={<Loading />}>{children}</Suspense>
            </div>

            <Footer />
            <Toaster />
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
};

export default RootLayout;
