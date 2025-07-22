import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import type { UserRole, AdminStats, PaginatedUsers } from "@/types/auth";

// Input schemas
const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

const updateRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["USER", "ADMIN", "MODERATOR"] as const),
});

const deleteUserSchema = z.object({
  userId: z.string().cuid(),
});

export const adminRouter = createTRPCRouter({
  getAllUsers: adminProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }): Promise<PaginatedUsers> => {
      const { page, limit, search } = input;
      const offset = (page - 1) * limit;

      const whereClause = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                accounts: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where: whereClause }),
      ]);

      return {
        users: users.map((user) => ({
          ...user,
          role: user.role as UserRole,
        })),
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  updateUserRole: adminProcedure
    .input(updateRoleSchema)
    .mutation(async ({ ctx, input }) => {
      // Prevent self-demotion
      if (input.userId === ctx.session.user.id && input.role !== "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change your own role",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return {
        ...updatedUser,
        role: updatedUser.role as UserRole,
      };
    }),

  deleteUser: adminProcedure
    .input(deleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deletion
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your own account",
        });
      }

      // Delete user and related data
      return await ctx.db.$transaction(async (tx) => {
        // Delete accounts first (foreign key constraint)
        await tx.account.deleteMany({
          where: { userId: input.userId },
        });

        // Delete sessions
        await tx.session.deleteMany({
          where: { userId: input.userId },
        });

        // Finally delete the user
        return await tx.user.delete({
          where: { id: input.userId },
        });
      });
    }),

  getSystemStats: adminProcedure.query(async ({ ctx }): Promise<AdminStats> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, totalAdmins, recentUsers] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "ADMIN" } }),
      ctx.db.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalAdmins,
      recentUsers,
    };
  }),
});