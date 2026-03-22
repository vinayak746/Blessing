"use client";

import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorFallback } from "@/components/query-error-fallback";

type QueryErrorBoundaryProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
};

export const QueryErrorBoundary = ({
  title,
  backHref,
  backLabel,
  children,
}: QueryErrorBoundaryProps) => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <QueryErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          title={title}
          backHref={backHref}
          backLabel={backLabel}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
