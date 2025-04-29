/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";
import Image from "next/image";
import EventZone from "../EventZone";
import Link from "next/link";

type Props = {
  opp: OppWithZoneType;
  types: TagType[];
};
const OpportunityDetailCard = ({ opp, types }: Readonly<Props>) => {
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };
  const calculateDaysLeft = (deadline: Date): number => {
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days
  };

  const daysLeft = opp.deadline ? calculateDaysLeft(opp.deadline) : null;

  return (
    <div className="shadow-brand w-full rounded-md border-2 bg-white p-5">
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="relative min-h-56 w-full rounded-md border-2 md:max-h-48 md:max-w-80">
          {opp.thumbnail_url && (
            <Image
              src={opp.thumbnail_url}
              width={400}
              height={400}
              blurDataURL={opp.thumbnail_url}
              placeholder="blur"
              alt={opp.name}
              className="absolute inset-0 h-full w-full rounded-md object-cover"
            />
          )}
        </div>
        <div className="items-center space-y-2">
          <h2 className="text-2xl font-bold">{opp.name}</h2>
          <div className="space-x-2">
            {" "}
            {opp.zones &&
              opp.zones.length > 0 &&
              opp.zones.map((zone: ZoneType) => (
                <EventZone key={zone.id} zone={zone} />
              ))}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">
              {opp.deadline ? formatDate(opp.deadline) : "Forever"}
            </p>
            {daysLeft !== null ? (
              <p className="text-primary text-sm font-bold">
                {daysLeft > 0 ? `${daysLeft} days left` : "Deadline has passed"}
              </p>
            ) : (
              <p className="text-sm font-bold text-gray-700">No deadline</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 mb-8 w-full border-1"></div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{opp.name}</h2>
        <div className="flex gap-2">
          {types.map((type) => (
            <span
              key={type.id}
              className="rounded-md border-2 px-2 py-1 text-sm font-semibold"
            >
              {type.name}
            </span>
          ))}
        </div>
        <p className="text-lg"> {opp.information}</p>
        <Link
          className="flex w-full justify-end"
          href={opp.url_og}
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="btn-brand-primary">Find out more!</button>
        </Link>
      </div>
    </div>
  );
};
export default OpportunityDetailCard;
