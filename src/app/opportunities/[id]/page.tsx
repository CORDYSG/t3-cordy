/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Suspense } from "react";
import LoadingComponent from "../../_components/LoadingComponent";
import { api } from "@/trpc/server";
import OpportunityDetailCard from "../../_components/Opportunities/OpportunityDetailCard";
import EventCard from "../../_components/EventCard";
import Head from "next/head";
import { auth } from "@/server/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReportModal from "@/app/_components/Swipe/ReportModal";

const OpportunityDetail = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const session = await auth();
  const user = session?.user;

  const opp: OppWithZoneType = await api.opp.getOppById({ oppId: id });

  // Dynamically generate metadata content
  const title = opp?.name ?? "Opportunity Details";
  const description = opp?.caption
    ? opp.caption.length > 160
      ? opp.caption.substring(0, 157) + "..."
      : opp.caption
    : "View detailed information about this opportunity and find similar opportunities.";
  const imageUrl = opp?.thumbnail_url ?? "";
  const typeKeywords = opp?.types?.map((t: TagType) => t.name).join(", ") ?? "";
  const zoneKeywords =
    opp?.zones?.map((z: ZoneType) => z.name).join(", ") ?? "";

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

  const { opps = [] } = await api.opp.searchOpportunities({
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
    name: opp?.name,
    description: opp?.description,
    image: opp?.image_url,
    url:
      `${process.env.NEXT_PUBLIC_SITE_URL}/opportunities/${id}` ||
      `https://app.cordy.sg/opportunities/${id}`,
    location: {
      "@type": "Place",
      name: opp?.zones?.map((z: ZoneType) => z.name).join(", "),
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "USD",
    },
    organizer: {
      "@type": "Organization",
      name: "Your Organization Name",
      url: "https://app.cordy.sg",
    },
  };

  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      <Head>
        <title>{`${title} | Opportunity Details`}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content={`opportunity, ${typeKeywords}, ${zoneKeywords}`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>

      <Suspense fallback={<LoadingComponent />}>
        <h1 className="sr-only">{opp?.name} - Opportunity Details</h1>

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
                href={`/opportunities?${opp.zones
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
