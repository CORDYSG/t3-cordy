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
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
    }

    const telegramIdString = input.id.toString();

    // Check if this telegram ID already exists in another User (avoid duplication)
    const existingUser = await ctx.db.user.findFirst({
      where: {
        telegramId: telegramIdString,
        NOT: { id: ctx.session.user.id },
      },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This Telegram account is already linked to another user.",
      });
    }

    // Find existing TeleUser by telegramId
    const teleUser = await ctx.db.teleUser.findFirst({
      where: { telegramId: telegramIdString },
    });

    // Update the User, and if teleUser exists, connect the foreign key
    const updatedUser = await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        telegramId: telegramIdString,
        teleUserHandle: input.username ?? undefined,
        name: input.first_name,
        username: input.username ?? undefined,
        teleUser: teleUser ? { connect: { id: teleUser.id } } : undefined,
      },
    });

    return { status: "ok", userId: updatedUser.id, teleLinked: !!teleUser };
  }),

    getUserData: protectedProcedure
    .query(async ({ ctx }) => {

        if (!ctx.session.user) {
            throw new Error("User not authenticated");
        }
        const user = await ctx.db.user.findUnique({
            where: { id: ctx.session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                telegramId: true,
                teleUserHandle: true,
            },
        });

  
        return user;
        }),

   
getUserProfile: protectedProcedure 
  .query(async ({ ctx }) => {
    // Add additional validation
 
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User session not found or invalid',
      });
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
interests: z.array(z.string()),
    interestsOther: z.string().optional(),
    isStudent: z.boolean(),
    schoolName: z.string().optional(),
    schoolType: SchoolTypeSchema.optional(),
  }))
.mutation(async ({ ctx, input }) => {
  const userId = ctx.session.user.id;

  try {
    // Upsert the main profile (excluding interests first)
    const userProfile = await ctx.db.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ageRange: input.ageRange,
        goals: input.goals,
        goalsOther: input.goalsOther,
        hearAboutSource: input.hearAboutSource,
        hearAboutOther: input.hearAboutOther,
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
        interestsOther: input.interestsOther,
        isStudent: input.isStudent,
        schoolName: input.schoolName,
        schoolType: input.schoolType,
        updatedAt: new Date(),
      },
    });

    // Step 1: Find Zones by airtable_id
    const matchedZones = await ctx.db.zones.findMany({
      where: {
        airtable_id: {
          in: input.interests,
        },
      },
      select: { id: true },
    });

    // Step 2: Delete existing interests
    await ctx.db.userProfileZone.deleteMany({
      where: {
        userProfileId: userProfile.id,
      },
    });

    // Step 3: Create new interest mappings
    await ctx.db.userProfileZone.createMany({
      data: matchedZones.map((zone) => ({
        userProfileId: userProfile.id,
        zoneId: zone.id,
      })),
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


  getUserLikedZoneBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;

    if (!userId) throw new Error("Not authenticated");

    // Fetch all liked opportunities with zone info
    const likedOpportunities = await ctx.db.userOpportunity.findMany({
      where: {
        userId,
        liked: true,
      },
      include: {
        opportunity: { 
          select: { 
            zone:true, 
            zone_id: true
          }
        }
      },
    });


    // Count zone frequencies
    const zoneCounts: Record<string, number> = {};

    for (const entry of likedOpportunities) {
      const zones = entry.opportunity?.zone ?? [];
 
      for (const z of zones) {
        const zoneName = z
        zoneCounts[zoneName] = (zoneCounts[zoneName] ?? 0) + 1;
      }
    }

    return {
      totalLiked: likedOpportunities.length,
      zoneBreakdown: zoneCounts,
    };
  }),
});



  