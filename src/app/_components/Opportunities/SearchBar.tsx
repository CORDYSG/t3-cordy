"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, X, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EventZone from "../EventZone";

type SearchBarProps = {
  search: string;
  onSearchChange: (search: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  zones: ZoneType[];
  selectedZones: ZoneType[];
  onZoneSelect: (zone: ZoneType) => void;
  types: TagTypes[];
  onSortChange?: (sortType: string) => void;
  onClearFilters?: () => void;
};

const SearchBar = ({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  zones,
  types,
  selectedZones,
  onZoneSelect,
}: SearchBarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleClearSearch = () => {
    onSearchChange("");
  };

  const handleClearAllFilters = () => {
    onSearchChange("");
    onTypeChange("");
  };

  return (
    <div className="container flex w-5/6 flex-col md:w-3/4">
      <div className="flex flex-row justify-around rounded-lg border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Search Bar */}
        <div className="flex w-8 items-center justify-center pl-2 md:w-10 md:border-r-2 md:border-black">
          <Search width={24} height={24} className="block md:hidden" />
        </div>
        <div className="relative flex w-full border-r-2 border-black md:w-5/6">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="font-brand w-full px-4 py-2 font-medium focus:outline-none"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1 hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between gap-4 px-4 text-center font-semibold text-black">
              <p className="font-brand hidden font-bold md:block">FILTERS</p>
              {isFilterOpen ? (
                <ChevronUp size={24} />
              ) : (
                <ChevronDown size={24} />
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="mt-2 border-1 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            align="end"
          >
            <div className="space-y-4">
              {selectedType != "" && (
                <button
                  className="flex cursor-pointer items-center space-x-2 rounded-r-md text-left font-semibold text-gray-500 uppercase"
                  onClick={handleClearAllFilters}
                >
                  <X size={16} /> <p>Clear</p>
                </button>
              )}
              <div>
                <p className="text-md font-medium text-gray-500">
                  Type of Event
                </p>
                <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {types.length > 0 ? (
                    types.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => onTypeChange(type.alias ?? "")}
                        className={`${selectedType === type.alias ? "bg-gray-100" : ""} cursor-pointer rounded-md py-1 pl-2 text-left outline-none hover:bg-gray-100`}
                      >
                        {type.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No zones available</p>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mx-auto mt-4 flex flex-wrap justify-center gap-x-1 gap-y-1.5 md:w-5/6 md:gap-y-3">
        {zones.length > 0 &&
          zones.map((zone) => (
            <div key={zone.id}>
              <EventZone
                zone={zone}
                interactive
                onClickZone={() => onZoneSelect(zone)}
                active={selectedZones.some((z) => z.id === zone.id)}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default SearchBar;
