import { z } from "zod";
import { db } from "@/server/db";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";


export const userRouter = createTRPCRouter({

    getUserData: protectedProcedure
    .query(async ({ ctx }) => {

        if (!ctx.session.user) {
            throw new Error("User not authenticated");
        }
        const user = await db.user.findUnique({
            where: { id: ctx.session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                telegramId: true,
            },
        });

        return user;
        })

    })
