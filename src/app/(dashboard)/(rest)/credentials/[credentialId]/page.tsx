import { CredentialView } from "@/features/credentials/components/credential";
import {
  CredentialViewLoading,
} from "@/features/credentials/components/credentials";
import { prefetchCredential } from "@/features/credentials/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";

interface PageProps {
  params: Promise<{
    credentialId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const session = await requireAuth();
  const { credentialId } = await params;
  
  // Validate credential exists and belongs to user
  const credential = await prisma.credential.findUnique({
    where: {
      id: credentialId,
      userId: session.user.id,
    },
    select: { id: true },
  });
  
  if (!credential) {
    notFound();
  }
  
  prefetchCredential(credentialId);
  return (
    <div className="p-4 md:px-10 md:py-6 h-full">
      <div className="mx-auto max-w-screen-md w-full flex flex-col gap-y-8 h-full">
        <HydrateClient>
          <QueryErrorBoundary
            title="Couldn't load this credential"
            backHref="/credentials"
            backLabel="Back to credentials"
          >
            <Suspense fallback={<CredentialViewLoading />}>
              <CredentialView credentialId={credentialId} />
            </Suspense>
          </QueryErrorBoundary>
        </HydrateClient>
      </div>
    </div>
  );
};

export default Page;
