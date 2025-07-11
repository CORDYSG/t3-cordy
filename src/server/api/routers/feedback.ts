import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const feedbackRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        message: z.string().min(5, "Message must be at least 5 characters long"),
        email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Clean up email - convert empty string to null
      const email = input.email?.trim() ? input.email.trim() : null;

      await ctx.db.websiteFeedback.create({
        data: {
          userId: ctx.session.user.id,
          message: input.message,
          email: email,
        },
      });

      return { success: true };
    }),
});
