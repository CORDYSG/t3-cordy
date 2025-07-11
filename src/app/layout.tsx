import "@/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans, Patrick_Hand } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { auth } from "@/server/auth";
import NewNavbar from "./_components/NewNavbar";
import Footer from "./_components/Footer";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "@/components/ui/sonner";
import DarkReaderOverride from "./_components/DarkModeOverride";

export const viewport = {
  colorScheme: "light", // ✅ correct place
};

export const metadata: Metadata = {
  title: "CORDY",
  description: "Find your passion. Find your opportunity.",
  openGraph: {
    title: "CORDY - Explore Opportunities.",
    description: "Explore opportunities with Cordy, find your passion.",
    url: "https://app.cordy.sg",
    siteName: "CORDY",
    images: [
      {
        url: "https://images.ctfassets.net/ayry21z1dzn2/34TCgC9EvR51gzdSpY3WJ8/6c4b4a3ccaceff0f765e65714b042489/Mask_group.jpg?h=250",
        width: 1200,
        height: 630,
        alt: "CORDY - Opportunity Platform Thumbnail",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CORDY – Explore Opportunities.",
    description: "Explore opportunities with Cordy, find your passion",
    images: [
      "https://images.ctfassets.net/ayry21z1dzn2/34TCgC9EvR51gzdSpY3WJ8/6c4b4a3ccaceff0f765e65714b042489/Mask_group.jpg?h=250",
    ],
  },
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
  other: {
    "darkreader-lock": "",
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

const mohrRounded = localFont({
  src: [
    {
      path: "../../public/fonts/mohr-rounded.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/mohr-rounded-bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/mohr-rounded-black.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-mohr-rounded",
  display: "swap",
  preload: true,
  fallback: ["sans-serif"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
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
      className={`${dmSans.variable} ${fatFrank.variable} ${gilroy.variable} ${patrickHand.variable} ${mohrRounded.variable}`}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#fff7e7" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="darkreader-lock" content="" />
      </head>
      <body className="flex min-h-screen w-screen flex-col justify-between overflow-x-hidden">
        <DarkReaderOverride />
        <TRPCReactProvider>
          <SessionProvider session={session}>
            <NewNavbar session={session} />
            <div className="min-h-[90vh]">
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
