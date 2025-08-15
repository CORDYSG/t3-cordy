import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { oppRouter } from "./routers/opp";
import { zoneRouter } from "./routers/zone";
import { typesRouter } from "./routers/types";
import { userOppRouter } from "./routers/userOpp";
import { userRouter } from "./routers/user";
import { feedbackRouter } from "./routers/feedback";
import { adminRouter } from "./routers/admin";
import { analyticsRouter } from "./routers/analytics";
import { activityRouter } from "./routers/activity";
import { act } from "react";
import { communityOppRouter } from "./routers/community";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  activity: activityRouter,
  analytics: analyticsRouter,
  opp: oppRouter,
  zone: zoneRouter,
  type: typesRouter,
  userOpp: userOppRouter,
  user: userRouter,
  feedback: feedbackRouter,
  admin: adminRouter,
  community: communityOppRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
