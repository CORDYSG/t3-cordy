/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Suspense } from "react";
import LoadingComponent from "../../_components/LoadingComponent";
import { api } from "@/trpc/server";
import OpportunityDetailCard from "../../_components/Opportunities/OpportunityDetailCard";
import EventCard from "../../_components/EventCard";

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

  const { opps = [], totalOpps = 0 } = await api.opp.searchOpportunities({
    search: "",
    type: opp?.types?.map((t: TagType) => t.alias) ?? [],
    zoneIds:
      opp?.zones
        ?.map((z: ZoneType) => z.name)
        .filter((name: string): name is string => name !== null) ?? [],
    page: 1,
    limit: 3,
    excludeOppIds: [opp.airtable_id],
  });

  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-3/4">
      <Suspense fallback={<LoadingComponent />}>
        <OpportunityDetailCard opp={opp} types={types} />

        <div className="my-4 w-full text-left font-bold">
          <h3 className="mb-8 text-2xl">Similar Opportunities</h3>
          <div className="flex w-full justify-between gap-5">
            {opps.length > 0 &&
              opps.map((opp: OppWithZoneType) => (
                <EventCard key={opp.id} opp={opp} static />
              ))}
          </div>
        </div>
      </Suspense>
    </div>
  );
};

export default OpportunityDetail;
