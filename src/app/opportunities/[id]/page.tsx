/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Suspense } from "react";
import LoadingComponent from "../../_components/LoadingComponent";
import { api } from "@/trpc/server";
import OpportunityDetailCard from "../../_components/Opportunities/OpportunityDetailCard";
import EventCard from "../../_components/EventCard";
import { Metadata } from "next";

// Define dynamic metadata generation for the page
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  // Fetch the opportunity data to use in metadata
  const opp = await api.opp.getOppById({
    oppId: params.id,
  });

  // Extract relevant information for SEO tags
  const title = opp?.name ?? "Opportunity Details";
  const description = opp?.caption
    ? opp.caption.length > 160
      ? opp.caption.substring(0, 157) + "..."
      : opp.caption
    : "View detailed information about this opportunity and find similar opportunities.";

  // Get the types and zones for keywords
  const typeKeywords = opp?.types?.map((t: TagType) => t.name).join(", ") ?? "";
  const zoneKeywords =
    opp?.zones?.map((z: ZoneType) => z.name).join(", ") ?? "";

  // Get the main image URL for OG image if available
  const imageUrl = opp?.thumbnail_url ?? "";

  return {
    title: `${title} | Opportunity Details`,
    description,
    keywords: `opportunity, ${typeKeywords}, ${zoneKeywords}`,
    openGraph: {
      title: `${title}`,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

const OpportunityDetail = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const opp: OppWithZoneType = await api.opp.getOppById({
    oppId: id,
  });

  const types = opp?.type_id
    ? await Promise.all(
        opp.type_id.map(async (typeId: string) => {
          return await api.type.getTypeById({ typeId });
        }),
      )
    : [];

  const { opps = [] } = await api.opp.searchOpportunities({
    search: "",
    type: opp?.types?.map((t: TagType) => t.alias) ?? [],
    zoneIds:
      opp?.zones
        ?.map((z: ZoneType) => z.name)
        .filter((name: string): name is string => name !== null) ?? [],
    page: 1,
    limit: 6,
    excludeOppIds: [opp.airtable_id],
  });

  // Prepare structured data for the opportunity
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event", // Using Event schema - adjust as needed based on your opportunity type
    name: opp?.name,
    description: opp?.description,
    image: opp?.image_url,
    url:
      `${process.env.NEXT_PUBLIC_SITE_URL}/opportunities/${id}` ||
      `https://yoursite.com/opportunities/${id}`,
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
      url: "https://yoursite.com",
    },
  };

  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      <Suspense fallback={<LoadingComponent />}>
        {/* Use semantic heading for the main title */}
        <h1 className="sr-only">{opp?.name} - Opportunity Details</h1>

        <article itemScope itemType="https://schema.org/Event">
          <OpportunityDetailCard opp={opp} types={types} />

          {/* Add any hidden microdata that might be missing from the card component */}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {opps.length > 0 &&
              opps.map((opp: OppWithZoneType) => (
                <div className="flex items-center justify-center" key={opp.id}>
                  <EventCard opp={opp} static />
                </div>
              ))}
            {opps.length === 0 && (
              <p className="col-span-3 text-center text-gray-500">
                No similar opportunities found
              </p>
            )}
          </div>
        </section>
      </Suspense>

      {/* Add JSON-LD structured data for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
    </main>
  );
};

export default OpportunityDetail;
