import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NodeType } from "@prisma/client";
import { z } from "zod";

// ============================================
// Type-safe schemas for request validation
// ============================================

const PositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const NodeSchema = z.object({
  id: z.string().min(1).max(128),
  type: z.nativeEnum(NodeType),
  position: PositionSchema,
  data: z.record(z.string(), z.unknown()).optional().default({}),
});

const EdgeSchema = z.object({
  source: z.string().min(1).max(128),
  target: z.string().min(1).max(128),
  sourceHandle: z.string().max(64).nullish(),
  targetHandle: z.string().max(64).nullish(),
});

const SaveBeaconRequestSchema = z.object({
  id: z.string().min(1).max(128),
  nodes: z.array(NodeSchema).max(500), // Limit max nodes
  edges: z.array(EdgeSchema).max(1000), // Limit max edges
});

type SaveBeaconRequest = z.infer<typeof SaveBeaconRequestSchema>;

// ============================================
// Rate limiting implementation
// ============================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!userLimit || userLimit.resetTime < now) {
    // Reset or initialize
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  userLimit.count++;
  return { allowed: true };
}

// ============================================
// Security helpers
// ============================================

function sanitizeString(str: string): string {
  // Remove null bytes and control characters
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function validateNodeData(data: Record<string, unknown>): Record<string, unknown> {
  // Deep clone and sanitize string values
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const sanitizedKey = sanitizeString(key).slice(0, 256);
    
    if (typeof value === "string") {
      sanitized[sanitizedKey] = sanitizeString(value).slice(0, 10000); // Limit string length
    } else if (typeof value === "number" && Number.isFinite(value)) {
      sanitized[sanitizedKey] = value;
    } else if (typeof value === "boolean") {
      sanitized[sanitizedKey] = value;
    } else if (value === null) {
      sanitized[sanitizedKey] = null;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.slice(0, 100); // Limit array length
    } else if (typeof value === "object" && value !== null) {
      sanitized[sanitizedKey] = validateNodeData(value as Record<string, unknown>);
    }
    // Skip functions, symbols, undefined, etc.
  }
  
  return sanitized;
}

// ============================================
// Main handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 3. Parse and validate request body with Zod
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parseResult = SaveBeaconRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid payload",
          details: parseResult.error.issues.map(i => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { id, nodes, edges } = parseResult.data;

    // 4. Verify workflow ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id, userId },
      select: { id: true }, // Only select id to minimize data transfer
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // 5. Validate edge references (all sources/targets must exist in nodes)
    const nodeIds = new Set(nodes.map(n => n.id));
    const invalidEdges = edges.filter(
      e => !nodeIds.has(e.source) || !nodeIds.has(e.target)
    );
    
    if (invalidEdges.length > 0) {
      return NextResponse.json(
        { error: "Invalid edges: references non-existent nodes" },
        { status: 400 }
      );
    }

    // 6. Save in a transaction with sanitized data
    await prisma.$transaction(async (tx) => {
      // Delete existing nodes and connections
      await tx.connection.deleteMany({ where: { workflowId: id } });
      await tx.node.deleteMany({ where: { workflowId: id } });

      // Create nodes with sanitized data
      if (nodes.length > 0) {
        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: sanitizeString(node.id),
            workflowId: id,
            name: node.type,
            type: node.type,
            position: {
              x: Math.round(node.position.x * 100) / 100,
              y: Math.round(node.position.y * 100) / 100,
            },
            data: validateNodeData(node.data || {}) as object,
          })),
        });
      }

      // Create connections
      if (edges.length > 0) {
        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: sanitizeString(edge.source),
            toNodeId: sanitizeString(edge.target),
            fromOutput: sanitizeString(edge.sourceHandle || "main"),
            toInput: sanitizeString(edge.targetHandle || "main"),
          })),
        });
      }

      // Update workflow timestamp
      await tx.workflow.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error securely (don't expose to client)
    console.error("Beacon save error:", error instanceof Error ? error.message : "Unknown error");
    
    return NextResponse.json(
      { error: "Save failed" },
      { status: 500 }
    );
  }
}
