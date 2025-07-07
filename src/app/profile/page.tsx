import { Suspense } from "react";
import LoadingComponent from "../_components/LoadingComponent";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import ProfileCard from "../_components/ProfilePage/ProfileCard";
import ProfileTabs from "../_components/ProfilePage/ProfileTabs";
import Head from "next/head";

const ProfilePage = async () => {
  // Dynamically generate metadata content
  const title = "User Profile";
  const description =
    "View users profle, including saved opportunities, liked opportunities, etc.";
  const imageUrl = "";

  const session = await auth();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "User Profile",
    description: "View user profile details",
    url:
      `${process.env.NEXT_PUBLIC_SITE_URL}/profile}` ||
      `https://app.cordy.sg/profile`,
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
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      <Head>
        <title>{`User Profile`}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={`opportunity, user, profile, details`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>

      <div className="w-full space-y-8">
        <Suspense fallback={<LoadingComponent />}>
          <h1 className="sr-only">User Profile Card</h1>

          <section
            aria-label="User Profile"
            className="my-4 flex h-full grid-rows-2 flex-col justify-center text-left font-bold"
          >
            <ProfileCard />
          </section>
        </Suspense>
        <Suspense fallback={<LoadingComponent />}>
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
