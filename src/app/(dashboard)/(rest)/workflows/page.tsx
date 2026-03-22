import { prefetchWorkflows } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { Suspense } from "react";
import {
  WorkflowsContainer,
  WorkflowsList,
  WorkflowsLoading,
} from "@/features/workflows/components/workflows";
import type { SearchParams } from "nuqs/server";
import { workflowsParamsLoader } from "@/features/workflows/server/params-loader";

type Props = {
  searchParams: Promise<SearchParams>;
};

const page = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await workflowsParamsLoader(searchParams);
  prefetchWorkflows(params);
  return (
    <HydrateClient>
      <QueryErrorBoundary title="Couldn't load workflows" backHref="/workflows">
        <Suspense fallback={<WorkflowsLoading />}>
          <WorkflowsContainer>
            <WorkflowsList />
          </WorkflowsContainer>
        </Suspense>
      </QueryErrorBoundary>
    </HydrateClient>
  );
};

export default page;
