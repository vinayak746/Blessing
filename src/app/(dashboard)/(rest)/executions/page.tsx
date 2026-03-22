
import { ExecutionsContainer, ExecutionsList, ExecutionsLoading } from "@/features/executions/components/executions";
import { executionsParamsLoader } from "@/features/executions/server/params-loader";
import { prefetchExecutions } from "@/features/executions/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<SearchParams>;
};

const page = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await executionsParamsLoader(searchParams);
  prefetchExecutions(params);
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
