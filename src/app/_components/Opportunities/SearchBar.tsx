"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  onTypeChange: (filter: string) => void;
  zones: ZoneType[];
  selectedZones: ZoneType[];
  onZoneSelect: (zone: ZoneType) => void;
  types: TagTypes[];
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

  return (
    <div className="container mt-4 flex w-3/4 flex-col">
      <div className="flex flex-row rounded-lg border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Search Bar */}
        <div className="w-10 border-r-2 border-black"></div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-3/4 border-r-2 border-black px-4 py-2 focus:outline-none md:w-5/6"
        />

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <div className="flex w-32 cursor-pointer items-center justify-between gap-4 px-4 text-center font-semibold text-black">
              <p>FILTERS</p>
              {isFilterOpen ? (
                <ChevronUp size={24} />
              ) : (
                <ChevronDown size={24} />
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="mt-2 border-2 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            data-side="right"
            align="end"
          >
            <div className="space-y-4">
              <div>
                <p className="text-md font-medium text-gray-500">
                  Type of Event
                </p>
                <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {types.length > 0 ? (
                    types.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => onZoneSelect(type)}
                        className="cursor-pointer rounded-md py-1 pl-2 hover:bg-gray-100"
                      >
                        {type.name}
                      </div>
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
      <div className="mt-8 flex justify-center gap-4">
        {zones.length > 0 &&
          zones.map((zone) => (
            <div key={zone.id}>
              <EventZone
                zone={zone}
                interactive
                onClickZone={() => onZoneSelect(zone)}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default SearchBar;
