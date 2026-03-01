import prisma from "@/lib/db";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";


export const executionsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.execution.findUniqueOrThrow({
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
     
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, } = input;

      const [items, totalCount] = await Promise.all([
        prisma.execution.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,

          where: {
            workflow: {
            userId: ctx.auth.user.id,
            }
          },
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
          where: {
            workflow: {
            userId: ctx.auth.user.id,
            }
          },
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
