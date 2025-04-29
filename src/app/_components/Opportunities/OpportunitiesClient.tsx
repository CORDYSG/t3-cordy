"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import SearchBar from "./SearchBar";
import EventCard from "../../_components/EventCard";
import LoadingComponent from "../../_components/LoadingComponent";
import Pagination from "./Pagination";

type OpportunitiesClientProps = {
  initialOpps: OpportunityType[];
  totalOpps: number;
  initialPage: number;
  limit: number;
  zones: ZoneType[];
  types: TagTypes[];
};

const OpportunitiesClient = ({
  initialOpps,
  totalOpps,
  initialPage,
  limit,
  zones,
  types,
}: OpportunitiesClientProps) => {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneType[]>([]);
  const [opps, setOpps] = useState<OpportunityType[]>(initialOpps);
  const [page, setPage] = useState(initialPage);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();

  // Client-side data fetching for search & filters
  const { data: searchResults, isLoading: searchLoading } =
    api.opp.searchOpportunities.useQuery(
      {
        search,
        type: selectedType,
        zoneIds: selectedZone?.map((z) => z.id) || [],
        page,
        limit,
      },
      {
        enabled: isSearching,
      },
    );

  useEffect(() => {
    if (searchResults) {
      setOpps(searchResults.opps);
      setIsSearching(false);
    }
  }, [searchResults]);

  // When search or filters change, update the search state
  useEffect(() => {
    if (search || selectedType !== "" || selectedZone.length > 0) {
      setIsSearching(true);
    }
  }, [search, selectedType, selectedZone]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`/opportunities?page=${newPage}`);
    // If we're not searching, we let the server handle pagination
    // If we are searching, the client-side query will update
    if (!search && selectedType === "" && selectedZone.length === 0) {
      router.refresh(); // Trigger a server refresh to get new data
    }
  };

  const handleSearch = (searchText: string) => {
    setSearch(searchText);
    setPage(1); // Reset to first page on new search
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setPage(1); // Reset to first page on filter change
  };

  const handleZoneSelect = (zone: ZoneType) => {
    if (selectedZone.some((z) => z.id === zone.id)) {
      setSelectedZone(selectedZone.filter((z) => z.id !== zone.id));
    } else {
      setSelectedZone([...selectedZone, zone]);
    }
    setPage(1); // Reset to first page on zone change
  };

  const renderPlaceholders = () => {
    const placeholders = [];
    for (let i = 0; i < 4; i++) {
      placeholders.push(
        <div
          key={`placeholder-${i}`}
          className="h-64 w-full rounded-lg border-2 border-dashed border-gray-300"
        ></div>,
      );
    }
    return placeholders;
  };

  const isLoading = searchLoading && isSearching;
  const displayedOpps = opps;
  const totalPages = Math.ceil(totalOpps / limit);

  return (
    <>
      <div className="flex min-h-64 w-full flex-col items-center justify-center">
        <div className="space-y-2 text-center">
          <h1 className="font-brand text-4xl text-black uppercase">
            Opportunities
          </h1>
          <p className="text-primary text-lg font-semibold">
            Passion is found from doing, not looking.
          </p>
        </div>

        <SearchBar
          search={search}
          onSearchChange={handleSearch}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          zones={zones}
          selectedZones={selectedZone}
          onZoneSelect={handleZoneSelect}
          types={types}
        />
      </div>

      <div className="container mt-8 w-3/4">
        {isLoading ? (
          <LoadingComponent />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayedOpps.length > 0 ? (
              displayedOpps.map((opp) => (
                <div key={opp.id} className="flex items-center justify-center">
                  <EventCard opp={opp} static />
                </div>
              ))
            ) : (
              <>
                {renderPlaceholders()}
                <div className="col-span-full flex h-32 items-center justify-center text-2xl font-bold text-gray-500">
                  No Opportunities Found
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!isLoading && totalOpps > limit && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );
};

export default OpportunitiesClient;
