import { z } from "zod";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const typesRouter = createTRPCRouter({
  getAllTypes: publicProcedure.query(async () => {
    const types = await db.types.findMany({});

    if (types.length === 0) return [];
    return types;
  }),
});
