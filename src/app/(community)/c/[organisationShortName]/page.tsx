/* eslint-disable @typescript-eslint/restrict-template-expressions */

import CommunityHeader from "@/app/_components/CommunityPage/CommunityHeader";
import OpportunitiesClient from "@/app/_components/CommunityPage/OpportunitiesClient";
import LoadingComponent from "@/app/_components/LoadingComponent";
import { api } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; organisationShortName: string }>;
}): Promise<Metadata> {
  const { id, organisationShortName } = await params;

  let community;
  try {
    community = await api.community.getCommunity({
      organisationShortName,
    });
  } catch (error) {
    return { title: "Community not found" };
  }

  const title = `${organisationShortName} | View All Opportunities`;

  const description = `View all opportunties in ${organisationShortName}.`;

  return {
    title: `${title}`,
    description,
    keywords: `opportunities, ${community?.abbreviation}, ${community?.name}`,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og/${organisationShortName}`,
          width: 1200,
          height: 630,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og/${organisationShortName}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

const CommunityPage = async ({
  params,
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
  params: Promise<{ organisationShortName: string }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { organisationShortName } = await params;

  // Parse page from search params with fallback to 1
  const page = parseInt(resolvedSearchParams.page ?? "1") || 1;
  const limit = 12;

  let community;
  try {
    community = await api.community.getCommunity({
      organisationShortName,
    });
  } catch (error) {
    redirect("/opportunities");
  }

  const organisationFullName = "National Library Board";
  const organisationSN = "Library";
  const [oppsData, types, zones] = await Promise.all([
    api.community.getAllCommunityOpportunitiesWithZonesLimit({
      organisationFullName,
      organisationShortName: organisationSN,
      limit,
      page,
    }),
    api.type.getAllTypes(),
    api.zone.getAllZones(),
  ]);

  const { opps = [], totalOpps = 0 } = oppsData;

  const totalPages = Math.ceil(totalOpps / limit);
  if (page < totalPages) {
    api.opp
      .getAllOpportunitiesWithZonesLimit({ limit, page: page + 1 })
      .then(() => console.debug(`Prefetched page ${page + 1}`))
      .catch(console.error);
  }
  return (
    <div className="container mx-auto pt-8">
      <CommunityHeader
        communityName={community?.abbreviation ?? "COM"}
        communityFullName={community?.name ?? "Community Full Name"}
        communityDescription={`One stop for ${community?.abbreviation} opportunities.`}
        memberCount={100}
        isMember={true}
      />
      <main className="flex min-h-screen flex-col items-center py-12">
        <Suspense fallback={<LoadingComponent />}>
          <OpportunitiesClient
            organisationFullName={organisationFullName}
            organisationShortName={organisationSN}
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
            <Link
              href={`/c/${organisationShortName}?page=${page - 1}`}
              rel="prev"
            >
              Previous Page
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/c/${organisationShortName}?page=${page + 1}`}
              rel="next"
            >
              Next Page
            </Link>
          )}
          {page > 1 && (
            <Link href={`/c/${organisationShortName}`} rel="first">
              First Page
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/c/${organisationShortName}?page=${totalPages}`}
              rel="last"
            >
              Last Page
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;
