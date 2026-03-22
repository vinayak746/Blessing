
import { ExecutionsContainer, ExecutionsList, ExecutionsLoading } from "@/features/executions/components/executions";
import { executionsParamsLoader } from "@/features/executions/server/params-loader";
import { prefetchExecutions } from "@/features/executions/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { SearchParams } from "nuqs";
import { Suspense } from "react";
import type { inferInput } from "@trpc/tanstack-react-query";
import { trpc } from "@/trpc/server";

type ExecutionsInput = inferInput<typeof trpc.executions.getMany>;

type Props = {
  searchParams: Promise<SearchParams>;
};

const page = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await executionsParamsLoader(searchParams);
  const normalizedParams: ExecutionsInput = {
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
  prefetchExecutions(normalizedParams);
  return (
    <HydrateClient>
      <QueryErrorBoundary title="Couldn't load executions" backHref="/executions">
        <Suspense fallback={<ExecutionsLoading/>}>
          <ExecutionsContainer>
            <ExecutionsList />
          </ExecutionsContainer>
        </Suspense>
      </QueryErrorBoundary>
    </HydrateClient>
  );
};

export default page;
