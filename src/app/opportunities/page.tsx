import { Suspense } from "react";
import { api } from "@/trpc/server";
import OpportunitiesClient from "../_components/Opportunities/OpportunitiesClient";
import LoadingComponent from "../_components/LoadingComponent";

const OpportunitiesPage = async({
  searchParams,
}: {
  searchParams: { page?: string };
}) =>{
  // Parse page from search params with fallback to 1
  const page = parseInt(searchParams.page ?? "1") || 1;
  const limit = 8;

  // Server-side data fetching
  const { opps = [], totalOpps = 0 } =
    await api.opp.getAllOpportunitiesWithZonesLimit({
      limit,
      page,
    });
  
  const types = await api.type.getAllTypes();

  // Fetch available zones for filters (if you need them)
  const zones = await api.zone.getAllZones();

  return (
    <div className="flex min-h-screen flex-col items-center py-16">
      <Suspense fallback={<LoadingComponent />}>
        <OpportunitiesClient
          initialOpps={opps}
          totalOpps={totalOpps}
          initialPage={page}
          limit={limit}
          zones={zones}
          types ={types}
        />
      </Suspense>
    </div>
);
  
}

export default OpportunitiesPage;


