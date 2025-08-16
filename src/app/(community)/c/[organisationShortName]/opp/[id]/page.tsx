/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Suspense } from "react";
import LoadingComponent from "@/app/_components/LoadingComponent";
import { api } from "@/trpc/server";
import OpportunityDetailCard from "@/app/_components/Opportunities/OpportunityDetailCard";
import EventCard from "@/app/_components/EventCard";
import Head from "next/head";
import { auth } from "@/server/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReportModal from "@/app/_components/Swipe/ReportModal";
import type { Metadata } from "next/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; organisationShortName: string }>;
}): Promise<Metadata> {
  const { id, organisationShortName } = await params;
  const opp: OppWithZoneType = await api.opp.getOppById({ oppId: id });

  if (!opp?.id) {
    return { title: "Opportunity not found" };
  }

  const capitalisedShortName = organisationShortName.toUpperCase();
  const title = opp?.name
    ? `${capitalisedShortName} | ${opp?.name}`
    : ` ${capitalisedShortName} | Opportunity Details`;
  const description = opp?.caption
    ? opp.caption.length > 160
      ? opp.caption.substring(0, 157) + "..."
      : opp.caption
    : "View detailed information about this opportunity and find similar opportunities.";

  const typeKeywords = opp?.types?.map((t: TagType) => t.name).join(", ") ?? "";
  const zoneKeywords =
    opp?.zones?.map((z: ZoneType) => z.name).join(", ") ?? "";

  return {
    title: `${title}`,
    description,
    keywords: `opportunity, ${typeKeywords}, ${zoneKeywords}`,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og/${organisationShortName}/opp/${id}`,
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
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og/${organisationShortName}/opp/${id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

const OpportunityDetail = async ({
  params,
}: {
  params: Promise<{ id: string; organisationShortName: string }>;
}) => {
  const { id, organisationShortName } = await params;
  const session = await auth();
  const user = session?.user;

  const opp: OppWithZoneType = await api.opp.getOppById({ oppId: id });

  // Dynamically generate metadata content

  const types = opp?.type_id
    ? await Promise.all(
        opp.type_id.map(async (typeId: string) => {
          return await api.type.getTypeById({ typeId });
        }),
      )
    : [];

  if (!opp?.id) {
    notFound();
  }

  const community = await api.community.getCommunity({
    organisationShortName: organisationShortName,
  });

  const { opps = [] } = await api.community.searchCommunityOpportunities({
    organisationFullName: community?.name ?? "",
    organisationShortName: community?.abbreviation ?? "",
    search: "",
    type: opp?.types?.map((t: TagType) => t.alias) ?? [],
    zoneIds:
      opp?.zones
        ?.map((z: ZoneType) => z.name)
        .filter((name: string): name is string => name !== null) ?? [],
    page: 1,
    limit: 9,
    excludeOppIds: opp?.airtable_id != null ? [opp.airtable_id] : [],
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opp?.name + " | CORDY",
    description: opp?.description,
    url:
      `${process.env.NEXT_PUBLIC_SITE_URL}/c/${organisationShortName}/opp/${id}` ||
      `https://app.cordy.sg/c/${organisationShortName}/opp/${id}`,
    location: {
      "@type": "Place",
      name: opp?.zones?.map((z: ZoneType) => z.name).join(", "),
    },

    organizer: {
      "@type": "Organization",
      name: "Your Organization Name",
      url: "https://app.cordy.sg",
    },
  };

  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      <Suspense fallback={<LoadingComponent />}>
        <h1 className="sr-only">
          {organisationShortName} | {opp?.name} - Opportunity Details
        </h1>

        <article
          itemScope
          itemType="https://schema.org/Event"
          className="w-full"
        >
          <OpportunityDetailCard opp={opp} types={types} />
          <meta itemProp="name" content={opp?.name ?? ""} />
          {opp?.description && (
            <meta itemProp="description" content={opp.description} />
          )}
        </article>

        <section
          aria-label="Similar Opportunities"
          className="my-4 flex h-full w-full grid-rows-2 flex-col justify-center text-left font-bold"
        >
          <h2 className="mb-8 text-2xl">Similar Opportunities</h2>
          <div className="grid grid-cols-1 gap-8 gap-y-4 px-8 md:grid-cols-2 md:px-0 lg:grid-cols-3">
            {opps.length > 0 &&
              opps.map((opp: OppWithZoneType) => (
                <div
                  className="my-2 flex items-center justify-center"
                  key={opp.id}
                >
                  <EventCard
                    opp={opp}
                    static
                    isAuthenticated={user !== null && user !== undefined}
                  />
                </div>
              ))}
            {opps.length === 0 && (
              <p className="col-span-3 text-center text-gray-500">
                No similar opportunities found
              </p>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            {opp?.zones && opp.zones.length > 0 && (
              <Link
                href={`/c/${organisationShortName}?${opp.zones
                  .map((z: ZoneType) => `zone=${z.id}`)
                  .join("&")}`}
                className="btn-brand-white flex w-fit"
              >
                <p>Find more similar opportunities</p>
              </Link>
            )}
          </div>
        </section>
      </Suspense>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
};

export default OpportunityDetail;
