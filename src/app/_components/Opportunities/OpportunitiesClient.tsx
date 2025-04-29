"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import EventCard from "../EventCard";

type Props = {
  initialOpps: OpportunityType[];
  totalOpps: number;
  currentPage: number;
  searchQuery: string;
};

export default function OpportunitiesClient({
  initialOpps,
  totalOpps,
  currentPage,
  searchQuery,
}: Readonly<Props>) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);

  const handleSearch = () => {
    router.replace(`/opportunities?search=${search}&page=1`);
  };

  const handlePageChange = (page: number) => {
    router.replace(`/opportunities?search=${search}&page=${page}`);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Search bar */}
      <div className="my-4 flex w-3/4 border-2 border-black shadow-lg">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-grow px-4 py-2 outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-black px-4 py-2 text-white"
        >
          Search
        </button>
      </div>

      {/* Opportunity cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {initialOpps.map((opp) => (
          <EventCard key={opp.id} opp={opp} static />
        ))}
      </div>

      {/* Pagination */}
      <div className="my-8 flex space-x-4">
        {currentPage > 1 && (
          <button onClick={() => handlePageChange(currentPage - 1)}>
            Previous
          </button>
        )}
        {currentPage * 8 < totalOpps && (
          <button onClick={() => handlePageChange(currentPage + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
