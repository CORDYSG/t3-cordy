/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useMemo } from "react";
import LoadingComponent from "../LoadingComponent";
import EventCard from "../EventCard";

type OpportunitiesListProps = {
  opps: OppWithZoneType[];
  isLoading: boolean;
  filterDescription: string;
  setIsNavigating: (value: boolean) => void;
};

const OpportunitiesList: React.FC<OpportunitiesListProps> = ({
  opps,
  isLoading,
  filterDescription,
  setIsNavigating,
}) => {
  if (isLoading) return <LoadingComponent />;

  return (
    <div className="w-full px-2 sm:px-4">
      {opps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-gray-600">
            No opportunities found matching your criteria
          </p>
          <p className="mt-2 text-gray-500">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <ul
          aria-label="Opportunities List"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {opps.map((opp) => (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            <li key={opp.id} className="flex h-full w-full">
              <div className="h-full w-full">
                <EventCard opp={opp} static pauseQueries={setIsNavigating} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OpportunitiesList;
