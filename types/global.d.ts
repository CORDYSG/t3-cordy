import type { Opps, Tags, Zones } from "@prisma/client";

declare global {
  type OpportunityType = Opps & {
    tags: { id: string; tag: string }[];
  };
  type TagType = Tags;
  type ZoneType = Zones;

  type OppWithZoneType = Prisma.OppsGetPayload<{
    include: { zones: true };
  }>;
}

export {};
