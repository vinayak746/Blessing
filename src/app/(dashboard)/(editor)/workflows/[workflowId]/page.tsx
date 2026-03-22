import {
  Editor,
  EditorLoading,
} from "@/features/editor/components/editor";
import { EditorHeader } from "@/features/editor/components/editor-header";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const session = await requireAuth();
  const { workflowId } = await params;

  const workflowExists = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!workflowExists) {
    notFound();
  }

  prefetchWorkflow(workflowId);
  return (
    <HydrateClient>
      <QueryErrorBoundary
        title="Couldn't load workflow editor"
        backHref="/workflows"
        backLabel="Back to workflows"
      >
        <Suspense fallback={<EditorLoading />}>
          <EditorHeader workflowId={workflowId} />
          <main className="flex-1">
            <Editor workflowId={workflowId} />
          </main>
        </Suspense>
      </QueryErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
