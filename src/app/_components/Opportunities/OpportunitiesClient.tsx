/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import SearchBar from "./SearchBar";
import EventCard from "../../_components/EventCard";
import LoadingComponent from "../../_components/LoadingComponent";
import Pagination from "./Pagination";
import Image from "next/image";

type OpportunitiesClientProps = {
  initialOpps: OppWithZoneType[];
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
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneType[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
            opps: initialOpps.map((opp) => ({
              ...opp,
              zones: [], // Add an empty zones array or populate it as needed
            })),
            totalOpps: totalOpps,
          },
    },
  );

  useEffect(() => {
    // If we're not on the opportunities page, set isNavigating to true
    // to prevent unnecessary queries
    setIsNavigating(
      !pathname?.startsWith("/opportunities") ||
        Boolean(/\/opportunities\/[^/]+$/.exec(pathname)),
    );
  }, [pathname]);

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

    if (isFiltered && !isNavigating) {
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

    // Update URL with filters as query parameters for better SEO and sharing
    const params = new URLSearchParams();
    params.set("page", newPage.toString());

    if (search) params.set("q", search);
    if (selectedType) params.set("type", selectedType);
    if (selectedZone.length > 0) {
      selectedZone.forEach((zone) => {
        params.append("zone", zone.id.toString());
      });
    }

    router.push(`/opportunities?${params.toString()}`);

    // If not filtering, let server handle pagination
    if (!isFiltered) {
      router.refresh();
    }

    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Generate filter description for better accessibility and SEO
  const generateFilterDescription = () => {
    const parts = [];
    if (search) parts.push(`matching "${search}"`);
    if (selectedType) {
      const typeName =
        types.find((t) => t.alias === selectedType)?.name ?? selectedType;
      parts.push(`in type "${typeName}"`);
    }
    if (selectedZone.length > 0) {
      const zoneNames = selectedZone.map((z) => z.name).join(", ");
      parts.push(`in zone${selectedZone.length > 1 ? "s" : ""} "${zoneNames}"`);
    }

    if (parts.length === 0) return "";
    return `Filtered opportunities ${parts.join(", ")}`;
  };

  const filterDescription = generateFilterDescription();

  return (
    <>
      <section
        aria-label="Opportunities Header"
        className="flex min-h-64 w-full flex-col items-center justify-center"
      >
        <header className="space-y-2 text-center">
          <h1 className="font-brand text-4xl text-black uppercase">
            Opportunities
          </h1>
          <p className="text-primary text-lg font-semibold">
            Passion is found from doing, not looking.
          </p>
        </header>

        <SearchBar
          search={search}
          onSearchChange={handleSearch}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          zones={zones}
          selectedZones={selectedZone}
          onZoneSelect={handleZoneSelect}
          types={types}
          aria-label="Filter opportunities"
        />
      </section>

      <section
        aria-label={filterDescription || "All Opportunities"}
        className="container mt-8 min-h-46 w-3/4"
      >
        {isLoading ? (
          <LoadingComponent />
        ) : (
          <>
            {(search !== "" ||
              selectedType !== "" ||
              selectedZone.length !== 0) && (
              <div className="mb-4">
                <h2 className="sr-only">Search Results</h2>
                <p className="font-semibold" aria-live="polite">
                  {displayTotal}{" "}
                  {displayTotal === 1 ? "Opportunity" : "Opportunities"} Found
                </p>
                {filterDescription && (
                  <p className="text-sm text-gray-600">{filterDescription}</p>
                )}
              </div>
            )}

            <ul
              aria-label="Opportunities List"
              className="grid grid-cols-1 gap-3 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {displayedOpps.length > 0 ? (
                displayedOpps.map((opp) => (
                  <li
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    key={"id" in opp ? opp.id.toString() : JSON.stringify(opp)}
                    className="flex items-center justify-center px-8"
                  >
                    <EventCard
                      opp={opp}
                      static
                      pauseQueries={setIsNavigating}
                    />
                  </li>
                ))
              ) : (
                <div className="text-md col-span-full flex h-full flex-col items-center justify-center space-y-2 font-bold">
                  <Image
                    src={
                      "https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg"
                    }
                    height={400}
                    width={400}
                    alt="No opportunities found illustration"
                    className="h-32 w-32"
                  />
                  <span className="font-medium italic">
                    &quot;Shucks!&quot;
                  </span>
                  <p className="font-semibold">No Opportunities Found.</p>
                  {filterDescription && (
                    <p className="mt-2 text-sm font-normal text-gray-600">
                      Try adjusting your search filters.
                    </p>
                  )}
                </div>
              )}
            </ul>
          </>
        )}
      </section>

      {!isLoading && displayTotal > limit && (
        <nav
          aria-label="Pagination Navigation"
          className="mx-auto flex w-full justify-center"
        >
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </nav>
      )}
    </>
  );
};

export default OpportunitiesClient;
