"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import SearchBar from "./SearchBar";
import EventCard from "../../_components/EventCard";
import LoadingComponent from "../../_components/LoadingComponent";
import Pagination from "./Pagination";
import Image from "next/image";
import OpportunitiesList from "./OpportunitiesList";

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

  const [isNavigating, setIsNavigating] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const currentQueryPage = useMemo(
    () => parseInt(searchParams.get("page") ?? "1") || 1,
    [searchParams],
  );

  const isFiltered = useMemo(
    () => search !== "" || selectedType !== "" || selectedZone.length > 0,
    [search, selectedType, selectedZone],
  );
  // Setup the TRPC query properly at component level

  const {
    data: searchResults,
    isLoading,
    refetch,
  } = api.opp.searchOpportunities.useQuery(
    {
      search,
      type: selectedType ? [selectedType] : [],
      zoneIds: selectedZone.map((z) => z.name).filter(Boolean) as string[],
      page,
      limit,
    },
    {
      enabled: isFiltered,
      staleTime: Infinity, // Keep the data until new data is fetched
      refetchOnWindowFocus: false, // Do not refetch on window focus
    },
  );

  useEffect(() => {
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

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (isFiltered && !isNavigating) {
      searchDebounceRef.current = setTimeout(() => {
        void refetch();
      }, 300);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [
    search,
    selectedType,
    selectedZone,
    page,
    isFiltered,
    isNavigating,
    refetch,
  ]);
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

  // Event handlers with useCallback
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);

      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());

      if (search) params.set("q", search);
      if (selectedType) params.set("type", selectedType);
      if (selectedZone.length > 0) {
        params.delete("zone");
        selectedZone.forEach((zone) => {
          params.append("zone", zone.id.toString());
        });
      }

      router.push(`/opportunities?${params.toString()}`);

      if (!isFiltered) {
        router.refresh();
      }

      window.scrollTo({ top: 50, behavior: "smooth" });
    },
    [search, selectedType, selectedZone, isFiltered, router, searchParams],
  );

  const handleSearch = useCallback((searchText: string) => {
    setSearch(searchText);
    setPage(1);
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
    setPage(1);
  }, []);

  const handleZoneSelect = useCallback((zone: ZoneType) => {
    setSelectedZone((prev) =>
      prev.some((z) => z.id === zone.id)
        ? prev.filter((z) => z.id !== zone.id)
        : [...prev, zone],
    );
    setPage(1);
  }, []);

  // Calculate display data based on filters
  const { displayedOpps, displayTotal, totalPages } = useMemo(() => {
    const opps = isFiltered ? (searchResults?.opps ?? []) : initialOpps;
    const total = isFiltered ? (searchResults?.totalOpps ?? 0) : totalOpps;
    return {
      displayedOpps: opps,
      displayTotal: total,
      totalPages: Math.ceil(total / limit),
    };
  }, [isFiltered, searchResults, initialOpps, totalOpps, limit]);
  // Generate filter description for better accessibility and SEO
  const filterDescription = useMemo(() => {
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
    return parts.length > 0 ? `Filtered opportunities ${parts.join(", ")}` : "";
  }, [search, selectedType, selectedZone, types]);

  return (
    <>
      <section
        aria-label="Opportunities Header"
        className="flex min-h-64 w-full flex-col items-center justify-center px-5"
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
            {(search || selectedType || selectedZone.length > 0) && (
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

            {displayedOpps.length > 0 ? (
              <OpportunitiesList
                opps={displayedOpps}
                isLoading={isLoading}
                filterDescription={filterDescription}
                setIsNavigating={setIsNavigating}
              />
            ) : (
              <div className="text-md col-span-full flex h-96 flex-col items-center justify-center space-y-2 font-bold">
                <Image
                  src={
                    "https://images.ctfassets.net/ayry21z1dzn2/3lJGKozj6dds5YDrNPmgha/756d620548c99faa2fa4622b3eb2e5b4/Toilet_Bowl.svg"
                  }
                  height={400}
                  width={400}
                  alt="No opportunities found illustration"
                  className="h-32 w-32"
                />
                <span className="font-medium italic">&quot;Shucks!&quot;</span>
                <p className="font-semibold">No Opportunities Found.</p>
                {filterDescription && (
                  <p className="mt-2 text-sm font-normal text-gray-600">
                    Try adjusting your search filters.
                  </p>
                )}
              </div>
            )}
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
