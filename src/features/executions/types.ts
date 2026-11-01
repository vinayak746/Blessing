import type { Realtime } from "@inngest/realtime";
import type { GetStepTools, Inngest } from "inngest";

export type WorkflowContext = Record<string, unknown>;

/**
 * Reserved context key a conditional node (IF / Switch) sets on the context
 * it returns, to tell the engine which output handle(s) it chose, e.g.
 * `{ ...context, [BRANCH_KEY]: ["true"] }`. The engine reads it and strips it
 * immediately, so it never reaches later nodes or the saved execution output.
 * Nodes that don't set it fire every output, which is the default.
 */
export const BRANCH_KEY = "__branch" as const;

export type StepTools = GetStepTools<Inngest.Any>;

export interface NodeExecutorParams<TData = Record<string, unknown>> {
  data: TData;
  nodeId: string;
  userId: string;
  context: WorkflowContext;
  step: StepTools;
  publish: Realtime.PublishFn;
}

export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>,
) => Promise<WorkflowContext>;
