import { Suspense } from "react";
import { api } from "@/trpc/server";
import OpportunitiesClient from "../_components/Opportunities/OpportunitiesClient";
import LoadingComponent from "../_components/LoadingComponent";
import type { Metadata } from "next";
import Link from "next/link";

// Define static metadata for the opportunities listing page
export const metadata: Metadata = {
  title: "Explore All Opportunities | Find Your Next Passion Project",
  description:
    "Browse and discover a wide range of opportunities tailored to your interests. Filter by type, location, and more to find your perfect match.",
  keywords: "opportunities, projects, activities, discover, browse, filter",
  openGraph: {
    title: "Explore All Opportunities | Find Your Next Passion Project",
    description:
      "Browse and discover a wide range of opportunities tailored to your interests. Filter by type, location, and more to find your perfect match.",
    type: "website",
    images: [
      {
        url: "https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg",
        width: 400,
        height: 400,
        alt: "Opportunities illustration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore All Opportunities | Find Your Next Passion Project",
    description:
      "Browse and discover a wide range of opportunities tailored to your interests. Filter by type, location, and more to find your perfect match.",
  },
};

// Generate dynamic metadata for paginated pages
async function generateMetadata({
  searchParams,
}: {
  searchParams: { page?: string };
}): Promise<Metadata> {
  const page = parseInt(searchParams.page ?? "1") || 1;

  // Only customize metadata for pages beyond the first
  if (page > 1) {
    return {
      title: `Explore Opportunities - Page ${page} | Find Your Next Passion Project`,
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical:
          page === 1 ? "/opportunities" : `/opportunities?page=${page}`,
      },
    };
  }

  // Return default metadata for page 1
  return {};
}

const OpportunitiesPage = async ({
  searchParams,
}: {
  searchParams: { page?: string };
}) => {
  // Parse page from search params with fallback to 1
  const page = parseInt(searchParams.page ?? "1") || 1;
  const limit = 12;

  // Server-side data fetching
  const { opps = [], totalOpps = 0 } =
    await api.opp.getAllOpportunitiesWithZonesLimit({
      limit,
      page,
    });

  const types = await api.type.getAllTypes();

  // Fetch available zones for filters
  const zones = await api.zone.getAllZones();

  // Calculate total pages for structured data
  const totalPages = Math.ceil(totalOpps / limit);

  // JSON-LD for collection page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Opportunities Directory",
    description:
      "Browse and discover a wide range of opportunities tailored to your interests.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/opportunities${page > 1 ? `?page=${page}` : ""}`,
    numberOfItems: totalOpps,
    itemListElement: opps.map((opp, index) => ({
      "@type": "ListItem",
      position: (page - 1) * limit + index + 1,
      item: {
        "@type": "Event",
        name: opp.name,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/opportunities/${opp.id}`,
      },
    })),
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-16">
      <Suspense fallback={<LoadingComponent />}>
        <OpportunitiesClient
          initialOpps={opps}
          totalOpps={totalOpps}
          initialPage={page}
          limit={limit}
          zones={zones}
          types={types}
        />
      </Suspense>

      {/* Pagination links for SEO (hidden visually but accessible to crawlers) */}
      <div className="sr-only">
        {page > 1 && (
          <Link href={`/opportunities?page=${page - 1}`} rel="prev">
            Previous Page
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/opportunities?page=${page + 1}`} rel="next">
            Next Page
          </Link>
        )}
        {page > 1 && (
          <Link href="/opportunities" rel="first">
            First Page
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/opportunities?page=${totalPages}`} rel="last">
            Last Page
          </Link>
        )}
      </div>

      {/* Add structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
    </main>
  );
};

export default OpportunitiesPage;
