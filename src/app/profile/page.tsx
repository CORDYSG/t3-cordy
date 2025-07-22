import { Suspense } from "react";
import LoadingComponent from "../_components/LoadingComponent";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import ProfileCard from "../_components/ProfilePage/ProfileCard";
import ProfileTabs from "../_components/ProfilePage/ProfileTabs";
import { api } from "@/trpc/server";
import type { Metadata } from "next";

// Generate metadata for the page
export const metadata: Metadata = {
  title: "User Profile",
  description:
    "View users profile, including saved opportunities, liked opportunities, etc.",
  keywords: "opportunity, user, profile, details",
  openGraph: {
    title: "User Profile",
    description:
      "View users profile, including saved opportunities, liked opportunities, etc.",
    type: "website",
    url:
      `${process.env.NEXT_PUBLIC_SITE_URL}/profile` ||
      "https://app.cordy.sg/profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "User Profile",
    description:
      "View users profile, including saved opportunities, liked opportunities, etc.",
  },
};

const ProfilePage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Add error handling for the API call
  let userProfile;
  try {
    userProfile = await api.user.getUserProfile();
  } catch (error) {
    // You might want to redirect to an error page or show a fallback
    throw new Error("Failed to load user profile");
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "User Profile",
    description: "View user profile details",
    url:
      `${process.env.NEXT_PUBLIC_SITE_URL}/profile` ||
      "https://app.cordy.sg/profile",
    location: {
      "@type": "Place",
      name: "profile",
    },
    organizer: {
      "@type": "Organization",
      name: "CORDYSG",
      url: "https://app.cordy.sg",
    },
  };

  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      <div className="w-full space-y-8">
        <Suspense fallback={<LoadingComponent />}>
          <h1 className="sr-only">User Profile Card</h1>
          <section
            aria-label="User Profile"
            className="my-4 flex h-full grid-rows-2 flex-col justify-center text-left font-bold"
          >
            <ProfileCard userCheck={userProfile} />
          </section>

          <h1 className="sr-only">User Opportunity List</h1>
          <section
            aria-label="User Opportunity Tabs"
            className="my-4 flex h-full w-full grid-rows-2 flex-col justify-center text-left font-bold"
          >
            <ProfileTabs />
          </section>
        </Suspense>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
};

export default ProfilePage;
