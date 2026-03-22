import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery,} from "@tanstack/react-query";
import { useExecutionsParams } from "./use-executions-params";
import type { inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type RouterInputs = inferRouterInputs<AppRouter>;
type ExecutionsGetManyInput = RouterInputs["executions"]["getMany"];

/**
 * Hook to fetch all executions using suspense
 */
export const useSuspenseExecutions = () => {
  const trpc = useTRPC();
  const [params] = useExecutionsParams();

  const normalizedParams: ExecutionsGetManyInput = {
    page: params.page,
    pageSize: params.pageSize,
    status:
      params.status === "success" ||
      params.status === "failed" ||
      params.status === "running"
        ? params.status
        : "all",
    range:
      params.range === "24h" || params.range === "7d" || params.range === "30d"
        ? params.range
        : "all",
  };

  return useSuspenseQuery(trpc.executions.getMany.queryOptions(normalizedParams));
};

/**
 * Hook to fetch a single execution using suspense
 */

export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery({
    ...trpc.executions.getOne.queryOptions({ id }),
    retry: false,
  });
};