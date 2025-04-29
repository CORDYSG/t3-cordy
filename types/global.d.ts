import type { Opps, Types, Zones } from "@prisma/client";

declare global {
  type OpportunityType = Opps;
  type TagType = Tags;
  type ZoneType = Zones;
  type TagTypes = Types;

  type OppWithZoneType = Prisma.OppsGetPayload<{
    include: { zones: true };
  }>;
}

export {};
