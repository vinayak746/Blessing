import prisma from "@/lib/db";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { ExecutionStatus } from "@prisma/client";
import z from "zod";
import { PAGINATION } from "@/config/constants";


export const executionsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const execution = await prisma.execution.findUnique({
        where: { id: input.id, workflow: { userId: ctx.auth.user.id } },
        include:{
          workflow:{
            select:{
              id:true,
              name:true,
            }
          }
        },
      });

      if (!execution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Execution not found",
        });
      }

      return execution;
    }),
  getByWorkflow: protectedProcedure
    .input(z.object({ 
      workflowId: z.string(),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      return prisma.execution.findMany({
        where: {
          workflowId: input.workflowId,
          workflow: { userId: ctx.auth.user.id },
        },
        orderBy: { startedAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      });
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        status: z
          .enum(["all", "success", "failed", "running"])
          .default("all"),
        range: z
          .enum(["all", "24h", "7d", "30d"])
          .default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, range } = input;

      const statusMap = {
        success: ExecutionStatus.SUCCESS,
        failed: ExecutionStatus.FAILED,
        running: ExecutionStatus.RUNNING,
      } as const;

      const rangeToDays = {
        "24h": 1,
        "7d": 7,
        "30d": 30,
      } as const;

      const startedAtFilter =
        range === "all"
          ? undefined
          : {
              gte: new Date(
                Date.now() - rangeToDays[range] * 24 * 60 * 60 * 1000,
              ),
            };

      const where = {
        workflow: {
          userId: ctx.auth.user.id,
        },
        status: status === "all" ? undefined : statusMap[status],
        startedAt: startedAtFilter,
      };

      const [items, totalCount] = await Promise.all([
        prisma.execution.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
          orderBy: {
            startedAt: "desc",
          },
          include:{
            workflow:{
              select:{
                id:true,
                name:true,
              }
            }
          },
          omit: { errorStack: true },
        }),
        prisma.execution.count({
          where,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),
});
