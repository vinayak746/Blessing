import { generateSlug } from "random-word-slugs";
import prisma from "@/lib/db";
import type { Node, Edge } from "@xyflow/react";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@prisma/client";
import { inngest } from "@/inngest/client";
import { sendWorkflowExecution } from "@/inngest/utils";

// Template configurations with pre-built nodes and connections
const workflowTemplates = {
  blank: {
    name: null, // Will use generated slug
    nodes: [{ type: NodeType.INITIAL, position: { x: 0, y: 0 } }],
    connections: [],
  },
  "form-to-slack": {
    name: "Form to Slack",
    nodes: [
      { type: NodeType.GOOGLE_FORM_TRIGGER, position: { x: 0, y: 0 } },
      { type: NodeType.SLACK, position: { x: 300, y: 0 } },
    ],
    connections: [{ fromIndex: 0, toIndex: 1 }],
  },
  "form-to-ai-summary": {
    name: "AI Form Summarizer",
    nodes: [
      { type: NodeType.GOOGLE_FORM_TRIGGER, position: { x: 0, y: 0 } },
      { type: NodeType.OPENAI, position: { x: 300, y: 0 } },
      { type: NodeType.DISCORD, position: { x: 600, y: 0 } },
    ],
    connections: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 1, toIndex: 2 },
    ],
  },
  "payment-notification": {
    name: "Payment Notifications",
    nodes: [
      { type: NodeType.STRIPE_TRIGGER, position: { x: 0, y: 0 } },
      { type: NodeType.SLACK, position: { x: 300, y: 0 } },
    ],
    connections: [{ fromIndex: 0, toIndex: 1 }],
  },
  "webhook-processor": {
    name: "Webhook Processor",
    nodes: [
      { type: NodeType.MANUAL_TRIGGER, position: { x: 0, y: 0 } },
      { type: NodeType.OPENAI, position: { x: 300, y: 0 } },
    ],
    connections: [{ fromIndex: 0, toIndex: 1 }],
  },
} as const;

type TemplateId = keyof typeof workflowTemplates;

export const workflowsRouter = createTRPCRouter({
  
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        
      });
      await sendWorkflowExecution({
        workflowId: input.id,
      })
      return workflow;
    }),

  create: premiumProcedure
    .input(z.object({ templateId: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const templateId = (input?.templateId || "blank") as TemplateId;
      const template = workflowTemplates[templateId] || workflowTemplates.blank;
      
      // Create the workflow
      const workflow = await prisma.workflow.create({
        data: {
          name: template.name || generateSlug(3),
          userId: ctx.auth.user.id,
        },
      });

      // Create nodes and collect their IDs
      const nodeIds: string[] = [];
      for (const node of template.nodes) {
        const createdNode = await prisma.node.create({
          data: {
            workflowId: workflow.id,
            type: node.type,
            name: node.type,
            position: node.position,
          },
        });
        nodeIds.push(createdNode.id);
      }

      // Create connections using the node IDs
      for (const conn of template.connections) {
        await prisma.connection.create({
          data: {
            workflowId: workflow.id,
            fromNodeId: nodeIds[conn.fromIndex],
            toNodeId: nodeIds[conn.toIndex],
            fromOutput: "main",
            toInput: "main",
          },
        });
      }

      return workflow;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          })
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id, userId: ctx.auth.user.id },
      });

      // Transaction to ensure consistency
      return await prisma.$transaction(async (tx) => {
        // Delete existing nodes and connections
        await tx.node.deleteMany({
          where: { workflowId: workflow.id },
        });

        // Create new nodes
        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type || "unknown",
            type: node.type as NodeType,
            position: node.position,
            data: node.data || {},
          })),
        });
        // Create new connections
        await tx.connection.createMany({
            data: edges.map((edge)=>({
                workflowId: id,
                fromNodeId: edge.source,
                toNodeId: edge.target,
                fromOutput: edge.sourceHandle || "main",
                toInput: edge.targetHandle || "main",
            })),
        });
        
        // Upate workflow's updatedAt timestamp
        await tx.workflow.update({
            where: {id},
            data: {updatedAt: new Date()},
        });
        return workflow;
      });
    }),
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUnique({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // Transform server nodes to react-flow compatible nodes
      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {},
      }));

      // Transform server connections to react-flow compatible edges
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
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
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,

          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.workflow.count({
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
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
