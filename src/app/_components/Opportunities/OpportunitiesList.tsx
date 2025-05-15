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
    <ul
      aria-label="Opportunities List"
      className="grid grid-cols-1 gap-3 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {opps.length > 0 &&
        opps.map((opp) => (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          <li key={opp.id} className="flex items-center justify-center px-8">
            <EventCard opp={opp} static pauseQueries={setIsNavigating} />
          </li>
        ))}
    </ul>
  );
};

export default OpportunitiesList;
