"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import SearchBar from "./SearchBar";

import LoadingComponent from "../../_components/LoadingComponent";
import Pagination from "./Pagination";
import Image from "next/image";
import OpportunitiesList from "./OpportunitiesList";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarArrowDown, CalendarArrowUp, FunnelPlus } from "lucide-react";

type OpportunitiesClientProps = {
  initialOpps: OppWithZoneType[];
  totalOpps: number;
  initialPage: number;
  limit: number;
  zones: ZoneType[];
  types: TagTypes[];
};

type SortOption = "newest" | "oldest" | "deadline-asc" | "deadline-desc";

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

  // Initialize states from URL parameters
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [selectedType, setSelectedType] = useState(
    () => searchParams.get("type") ?? "",
  );
  const [selectedZone, setSelectedZone] = useState<ZoneType[]>(() => {
    const zoneParams = searchParams.getAll("zone");
    if (zoneParams.length === 0) return [];

    return zoneParams
      .map((zoneParam) => {
        // Try to find by ID first (numeric)
        const zoneById = zones.find((z) => z.id.toString() === zoneParam);
        if (zoneById) return zoneById;

        // Fallback to find by name
        const zoneByName = zones.find((z) => z.name === zoneParam);
        return zoneByName;
      })
      .filter((zone): zone is ZoneType => zone !== undefined);
  });

  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const urlSort = searchParams.get("sort");
    return (urlSort as SortOption) ?? "newest";
  });

  const [isNavigating, setIsNavigating] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

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
      sortBy,
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      refetchOnWindowFocus: false,
      enabled: isInitialized, // Only run query after initialization
    },
  );

  useEffect(() => {
    // Only sync from URL on initial mount or when navigating from external source
    if (!isInitialized) {
      const urlSearch = searchParams.get("q") ?? "";
      const urlType = searchParams.get("type") ?? "";
      const urlZoneParams = searchParams.getAll("zone");
      const urlSort = (searchParams.get("sort") as SortOption) ?? "newest";

      // Set search if different from initial
      if (urlSearch !== search) {
        setSearch(urlSearch);
      }

      // Set type if different from initial
      if (urlType !== selectedType) {
        setSelectedType(urlType);
      }

      // Set zones if different from initial
      const urlZones = urlZoneParams
        .map((zoneParam) => {
          const zoneById = zones.find((z) => z.id.toString() === zoneParam);
          if (zoneById) return zoneById;

          const zoneByName = zones.find((z) => z.name === zoneParam);
          return zoneByName;
        })
        .filter((zone): zone is ZoneType => zone !== undefined);

      const currentZoneIds = selectedZone.map((z) => String(z.id)).sort();
      const urlZoneIds = urlZones.map((z) => String(z.id)).sort();

      if (
        currentZoneIds.length !== urlZoneIds.length ||
        !currentZoneIds.every((id, index) => id === urlZoneIds[index])
      ) {
        setSelectedZone(urlZones);
      }

      // Set sort if different from initial
      if (urlSort !== sortBy) {
        setSortBy(urlSort);
      }

      setIsInitialized(true);
    }
  }, [
    searchParams,
    zones,
    isInitialized,
    search,
    selectedType,
    selectedZone,
    sortBy,
  ]);

  useEffect(() => {
    setIsNavigating(
      !pathname?.startsWith("/opportunities") ||
        Boolean(/\/opportunities\/[^/]+$/.exec(pathname)),
    );
  }, [pathname]);

  useEffect(() => {
    if (!isInitialized) {
      const currentPage = parseInt(searchParams.get("page") ?? "1") || 1;

      setPage(currentPage);
    }
  }, [searchParams, isInitialized]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!isNavigating) {
      searchDebounceRef.current = setTimeout(() => {
        void refetch();
      }, 300);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search, selectedType, selectedZone, page, sortBy, isNavigating, refetch]);

  // Event handlers with useCallback
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);

      const params = new URLSearchParams();

      if (search) params.set("q", search);
      if (selectedType) params.set("type", selectedType);
      if (selectedZone.length > 0) {
        selectedZone.forEach((zone) => {
          params.append("zone", zone.id.toString());
        });
      }
      if (sortBy !== "newest") params.set("sort", sortBy);
      if (newPage > 1) params.set("page", newPage.toString());

      const queryString = params.toString();
      const newUrl = queryString
        ? `/opportunities?${queryString}`
        : "/opportunities";

      router.push(newUrl);

      window.scrollTo({ top: 50, behavior: "smooth" });
    },
    [search, selectedType, selectedZone, sortBy, router, page],
  );

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (search) params.set("q", search);
    if (selectedType) params.set("type", selectedType);
    if (selectedZone.length > 0) {
      selectedZone.forEach((zone) => {
        params.append("zone", zone.id.toString());
      });
    }
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (page > 1) params.set("page", page.toString());

    const queryString = params.toString();
    const newUrl = queryString
      ? `/opportunities?${queryString}`
      : "/opportunities";

    router.push(newUrl);
  }, [search, selectedType, selectedZone, sortBy, page, router]);

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

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    setPage(1);
  }, []);

  // Update URL when filters change (but not during navigation or initialization)
  useEffect(() => {
    if (!isNavigating && isInitialized) {
      updateURL();
    }
  }, [
    search,
    selectedType,
    selectedZone,
    sortBy,
    page,
    isNavigating,
    isInitialized,
    updateURL,
  ]);

  // Calculate display data based on filters and sort
  const { displayedOpps, displayTotal, totalPages } = useMemo(() => {
    // Use searchResults when available and when filtering is active, otherwise use initialOpps
    const opps =
      isFiltered || searchResults ? (searchResults?.opps ?? []) : initialOpps;
    const total =
      isFiltered || searchResults ? (searchResults?.totalOpps ?? 0) : totalOpps;

    return {
      displayedOpps: opps,
      displayTotal: total,
      totalPages: Math.ceil(total / limit),
    };
  }, [searchResults, initialOpps, totalOpps, limit, isFiltered, page]);

  // Generate filter description for better accessibility and SEO
  const filterDescription = useMemo(() => {
    const parts: string[] = [];
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

  const sortOptions = [
    {
      value: "newest" as const,
      label: "Newest Added",
      icon: <FunnelPlus className="h-4 w-4" />,
    },
    {
      value: "deadline-asc" as const,
      label: "Deadline (Earliest)",
      icon: <CalendarArrowUp className="h-4 w-4" />,
    },
    {
      value: "deadline-desc" as const,
      label: "Deadline (Latest)",
      icon: <CalendarArrowDown className="h-4 w-4" />,
    },
  ] as const;

  return (
    <>
      <section
        aria-label="Opportunities Header"
        className="flex w-full flex-col items-center justify-center"
      >
        <header className="mb-4 text-center">
          <h1 className="font-brand sr-only text-4xl font-bold text-black uppercase">
            All Opportunities
          </h1>
          <h4 className="text-primary hidden text-xl font-semibold md:block">
            Passion is found from doing, not looking.
          </h4>
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
            {/* Sort Controls */}
            <div className="mb-6 flex flex-col gap-4">
              <div>
                {(search || selectedType || selectedZone.length > 0) && (
                  <>
                    <h2 className="sr-only">Search Results</h2>
                    <p className="font-semibold" aria-live="polite">
                      {displayTotal}{" "}
                      {displayTotal === 1 ? "Opportunity" : "Opportunities"}{" "}
                      Found
                    </p>
                    {filterDescription && (
                      <p className="text-sm text-gray-600">
                        {filterDescription}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="sr-only">Sort by:</span>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <TooltipProvider key={option.value}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSortChange(option.value)}
                            className={`rounded-lg border-2 px-4 py-2 transition-all ${
                              sortBy === option.value
                                ? "bg-primary shadow-brand text-black"
                                : "bg-white hover:bg-gray-300"
                            }`}
                            aria-label={option.label}
                          >
                            {option.icon}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {option.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>

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
