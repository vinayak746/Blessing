import { CredentialsContainer, CredentialsList, CredentialsLoading } from "@/features/credentials/components/credentials";
import { credentialsParamsLoader } from "@/features/credentials/server/params-loader";
import { prefetchCredentials } from "@/features/credentials/server/prefetch";
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

  const params = await credentialsParamsLoader(searchParams);
  prefetchCredentials(params);
  return (
    <HydrateClient>
      <QueryErrorBoundary title="Couldn't load credentials" backHref="/credentials">
        <Suspense fallback={<CredentialsLoading />}>
          <CredentialsContainer>
            <CredentialsList />
          </CredentialsContainer>
        </Suspense>
      </QueryErrorBoundary>
    </HydrateClient>
  );
};

export default page;
