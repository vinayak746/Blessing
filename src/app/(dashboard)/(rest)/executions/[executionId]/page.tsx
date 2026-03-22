import { ExecutionView } from "@/features/executions/components/execution";
import { prefetchExecution } from "@/features/executions/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { ExecutionDetailSkeleton } from "@/components/skeletons";

interface PageProps {
    params: Promise<{
        executionId: string
    }>
}

const Page = async({params}: PageProps) => {
  const session = await requireAuth();
    const {executionId} = await params;
    
    // Validate execution exists and belongs to user's workflow
    const execution = await prisma.execution.findFirst({
      where: {
        id: executionId,
        workflow: {
          userId: session.user.id,
        },
      },
      select: { id: true },
    });

    if (!execution) {
      notFound();
    }
    
    prefetchExecution(executionId);
  return (
    <div className="p-3 sm:p-4 md:px-10 md:py-6 h-full">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-y-6 sm:gap-y-8 h-full">
        <HydrateClient>
          <QueryErrorBoundary
            title="Couldn't load this execution"
            backHref="/executions"
            backLabel="Back to executions"
          >
            <Suspense fallback={<ExecutionDetailSkeleton />}>
              <ExecutionView executionId={executionId}/>
            </Suspense>
          </QueryErrorBoundary>
        
        </HydrateClient>
       </div>
      
    </div>
  )
}

export default Page
