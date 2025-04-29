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

  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      <Suspense fallback={<LoadingComponent />}>
        <OpportunityDetailCard opp={opp} types={types} />

        <div className="my-4 flex h-full w-full grid-rows-2 flex-col justify-center text-left font-bold">
          <h3 className="mb-8 text-2xl">Similar Opportunities</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {opps.length > 0 &&
              opps.map((opp: OppWithZoneType) => (
                <div className="flex items-center justify-center" key={opp.id}>
                  <EventCard opp={opp} static />
                </div>
              ))}
          </div>
        </div>
      </Suspense>
    </div>
  );
};

export default OpportunityDetail;
