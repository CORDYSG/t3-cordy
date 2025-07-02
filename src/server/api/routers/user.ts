import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { 
  AgeRange, 
  HearAboutSource, 
  GoalType, 
  InterestCategory, 
  school_type 
} from '@prisma/client';
import { db } from '@/server/db';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { verifyTelegramLogin } from '@/lib/utils';

// Create validation schemas that match your enums exactly
const AgeRangeSchema = z.nativeEnum(AgeRange);

const HearAboutSourceSchema = z.nativeEnum(HearAboutSource);
const GoalTypeSchema = z.nativeEnum(GoalType);
const InterestCategorySchema = z.nativeEnum(InterestCategory);
const SchoolTypeSchema = z.nativeEnum(school_type);


export const userRouter = createTRPCRouter({

 linkToTelegram: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        first_name: z.string(),
        last_name: z.string().optional(),
        username: z.string().optional(),
        photo_url: z.string().optional(),
        auth_date: z.string(),
        hash: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const isValid = verifyTelegramLogin(input, process.env.TELEGRAM_BOT_TOKEN!);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Telegram login" });
      }
    if (!ctx.session.user) {
            throw new Error("User not authenticated");
    }

      // Check if user exists
      const existing = await ctx.db.user.findFirst({
        where: { telegramId: input.id.toString() },
      });

      if (existing) {
        return { status: "ok", userId: existing.id };
      }


      const result = await ctx.db.user.update({
          data: {
              telegramId: input.id.toString(),
              name: input.first_name,
              username: input.username ?? undefined,
          },
          where: { 
            id: ctx.session.user.id
          }
      });

      return { status: "ok", userId: result.id };
    }),
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
        }),

    getUserProfile: protectedProcedure 
    .query(async ({ ctx }) => {

        if (!ctx.session.user) {
            throw new Error("User not authenticated");
        }
        const user = await db.userProfile.findUnique({
            where: { userId: ctx.session.user.id },
            select: {
                id: true,
            },
        });

        return user;
        }),

   createUserProfile: protectedProcedure
  .input(z.object({
    ageRange: AgeRangeSchema,
    goals: z.array(GoalTypeSchema),
    goalsOther: z.string().optional(),
    hearAboutSource: HearAboutSourceSchema,
    hearAboutOther: z.string().optional(),
    interests: z.array(InterestCategorySchema),
    interestsOther: z.string().optional(),
    isStudent: z.boolean(),
    schoolName: z.string().optional(),
    schoolType: SchoolTypeSchema.optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    try {
      // No need for type casting since validation ensures correct types
      const userProfile = await ctx.db.userProfile.upsert({
        where: {
          userId: userId,
        },
        create: {
          userId: userId,
          ageRange: input.ageRange,
          goals: input.goals,
          goalsOther: input.goalsOther,
          hearAboutSource: input.hearAboutSource,
          hearAboutOther: input.hearAboutOther,
          interests: input.interests,
          interestsOther: input.interestsOther,
          isStudent: input.isStudent,
          schoolName: input.schoolName,
          schoolType: input.schoolType,
        },
        update: {
          ageRange: input.ageRange,
          goals: input.goals,
          goalsOther: input.goalsOther,
          hearAboutSource: input.hearAboutSource,
          hearAboutOther: input.hearAboutOther,
          interests: input.interests,
          interestsOther: input.interestsOther,
          isStudent: input.isStudent,
          schoolName: input.schoolName,
          schoolType: input.schoolType,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        userProfile,
      };
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create or update user profile',
        cause: error,
      });
    }
  }),


    })
