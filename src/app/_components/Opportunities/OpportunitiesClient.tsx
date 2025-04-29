"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import SearchBar from "./SearchBar";
import EventCard from "../../_components/EventCard";
import LoadingComponent from "../../_components/LoadingComponent";
import Pagination from "./Pagination";
import Image from "next/image";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneType[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isFiltered, setIsFiltered] = useState(false);

  const currentQueryPage = parseInt(searchParams.get("page") ?? "1") || 1;
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Setup the TRPC query properly at component level
  const {
    data: searchResults,
    isLoading,
    refetch,
  } = api.opp.searchOpportunities.useQuery(
    {
      search,
      type: selectedType != "" ? [selectedType] : [],
      zoneIds:
        selectedZone
          ?.map((z) => z.name)
          .filter((name): name is string => name !== null) || [],
      page,
      limit,
    },
    {
      enabled: isFiltered,
      initialData: isFiltered
        ? undefined
        : {
            opps: initialOpps.map((opp) => ({
              ...opp,
              zones: [], // Add an empty zones array or populate it as needed
            })),
            totalOpps: totalOpps,
          },
    },
  );

  // Update page when URL changes
  useEffect(() => {
    if (currentQueryPage !== page) {
      setPage(currentQueryPage);
    }
  }, [currentQueryPage]);

  // Determine if we should be using filtered data
  useEffect(() => {
    const hasFilters =
      search !== "" || selectedType !== "" || selectedZone.length > 0;
    setIsFiltered(hasFilters);
  }, [search, selectedType, selectedZone]);

  // Debounce search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (isFiltered) {
      searchDebounceRef.current = setTimeout(() => {
        void refetch();
      }, 300);
    }

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search, selectedType, selectedZone, page, isFiltered, refetch]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`/opportunities?page=${newPage}`);

    // If not filtering, let server handle pagination
    if (!isFiltered) {
      router.refresh();
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

  // Calculate display data based on filters
  const displayedOpps = isFiltered ? (searchResults?.opps ?? []) : initialOpps;
  const displayTotal = isFiltered ? (searchResults?.totalOpps ?? 0) : totalOpps;
  const totalPages = Math.ceil(displayTotal / limit);

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

      <div className="container mt-8 min-h-46 w-3/4">
        {isLoading ? (
          <LoadingComponent />
        ) : (
          <>
            {search != "" ||
              selectedType != "" ||
              (selectedZone.length != 0 && displayTotal != totalOpps && (
                <p className="mb-4 font-semibold">
                  {displayTotal} Opportunities Found
                </p>
              ))}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayedOpps.length > 0 ? (
                displayedOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-center"
                  >
                    <EventCard opp={opp} static />
                  </div>
                ))
              ) : (
                <div className="text-md col-span-full flex h-full flex-col items-center justify-center space-y-2 font-bold">
                  <Image
                    src={
                      "https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg"
                    }
                    height="400"
                    width="400"
                    alt="No Opportunities Found"
                    className="h-32 w-32"
                  />
                  <span className="font-medium italic">
                    &quot;Shucks!&quot;
                  </span>
                  <p className="font-semibold">No Opportunities Found.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isLoading && displayTotal > limit && (
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
