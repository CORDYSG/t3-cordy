"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import EventCard from "../_components/EventCard";
import LoadingComponent from "../_components/LoadingComponent";
import OpportunitiesClient from "../_components/Opportunities/OpportunitiesClient";

// Default values shown

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";

const OpportunitiesPage = () => {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [zones, setZones] = useState<ZoneType[]>([]);

  const [selectedZone, setSelectedZone] = useState<ZoneType[]>();

  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1") || 1;
  const limit = 8;

  const { data: { opps = [], totalOpps = 0 } = {}, isLoading: oppsLoading } =
    api.opp.getAllOpportunitiesWithZonesLimit.useQuery({ limit, page });

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

  const filters = ["All", "Open", "Closed", "Pending"];

  const totalPages = Math.ceil(totalOpps / limit); // Calculate total pages

  const handlePageChange = (newPage: number) => {
    void router.push(`/opportunities?page=${newPage}`);
  };

  const displayRange = (current: number, total: number) => {
    const maxRange = 2; // Show 2 numbers on either side
    let result = [];

    // Numbers before the current one
    for (let i = Math.max(1, current - maxRange); i < current; i++) {
      result.push(i);
    }

    // Add the current number
    result.push(current);

    // Numbers after the current one
    for (let i = current + 1; i <= Math.min(total, current + maxRange); i++) {
      result.push(i);
    }

    // Add "..." if there are missing numbers before or after
    if (current - maxRange > 1) {
      result = [1, "...", ...result];
    }
    if (current + maxRange < total) {
      result = [...result, "...", total];
    }

    return result.join(" ");
  };

  return (
    <div className="flex min-h-screen flex-col items-center py-16">
      <div className="flex min-h-64 w-full flex-col items-center justify-center">
        <div className="space-y-2 text-center">
          {" "}
          <h1 className="font-brand text-4xl text-black uppercase">
            Opportunities
          </h1>
          <p className="text-primary text-lg font-semibold">
            Passion is found from doing, not looking.
          </p>
        </div>

        <div className="container mt-4 flex w-3/4 rounded-lg border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Search Bar */}
          <div className="w-10 border-r-2 border-black"></div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-3/4 border-r-2 border-black px-4 py-2 focus:outline-none md:w-5/6"
          />

          {/* Filters Dropdown */}
          <Popover>
            <PopoverTrigger>
              <div className="flex w-32 cursor-pointer justify-between gap-4 px-4 font-semibold text-black">
                <p>FILTERS</p>
                <ChevronUp size={24} className="" />
              </div>
            </PopoverTrigger>

            <PopoverContent
              className="mt-2 w-full border-2 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              data-side="right"
              align="end"
            >
              <div>
                <p className="text-md font-medium text-gray-500">
                  Type of Event
                </p>
                <div>
                  {/* <ul>
                  {zones.length > 0 &&
                    zones.map((zone) => <li key={zone.id}>

                    </li>)}
                </ul> */}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="container mt-8 w-3/4">
        {oppsLoading || opps == undefined ? (
          <LoadingComponent />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {opps.length > 0 ? (
              opps.map((opp) => (
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
      {!oppsLoading && totalOpps > limit && (
        <div className="container my-16 flex w-3/4 flex-col justify-center">
          <div className="mb-8 flex w-full justify-between">
            <div>
              {" "}
              {page > 1 && (
                <button
                  type="button"
                  className="btn-brand-white flex items-center text-sm uppercase"
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ArrowLeft size={20} />
                  <p className="hidden md:block">PREVIOUS PAGE</p>
                </button>
              )}
            </div>
            <div>
              {" "}
              {page !== totalPages && (
                <button
                  type="button"
                  className="btn-brand-white flex text-sm uppercase"
                  onClick={() => handlePageChange(page + 1)}
                >
                  <p className="hidden md:block">NEXT PAGE</p>
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
          {/* Previous button */}
          <div className="flex items-center justify-center">
            <p className="mr-5 hidden font-semibold text-black md:block">
              Page
            </p>
            {(() => {
              const maxRange = 1;
              let pages = [];

              // Add pages before the current page
              for (let i = Math.max(1, page - maxRange); i < page; i++) {
                pages.push(i);
              }

              // Add the current page
              pages.push(page);

              // Add pages after the current page
              for (
                let i = page + 1;
                i <= Math.min(totalPages, page + maxRange);
                i++
              ) {
                pages.push(i);
              }

              // Add "..." if there are missing numbers before or after
              if (page - maxRange > 1) {
                pages = [1, "...", ...pages];
              }
              if (page + maxRange < totalPages) {
                pages = [...pages, "...", totalPages];
              }

              return pages.map((pageNumber, index) => (
                <button
                  key={index}
                  onClick={() =>
                    typeof pageNumber === "number" &&
                    handlePageChange(pageNumber)
                  }
                  className={`cursor-pointer text-lg ${
                    page === pageNumber
                      ? "bg-primary mx-2 flex aspect-square h-9 w-9 items-center justify-center rounded-full border-2 text-center font-black text-black"
                      : pageNumber === "..."
                        ? "cursor-move px-2"
                        : "hover:text-primary px-2 py-2 font-semibold text-black hover:underline"
                  }`}
                  disabled={pageNumber === "..."}
                >
                  {pageNumber}
                </button>
              ));
            })()}
            {/* Next button */}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;
