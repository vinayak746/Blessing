"use client";

import { AlertTriangleIcon, RefreshCcwIcon, ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type QueryErrorFallbackProps = {
  error: unknown;
  resetErrorBoundary: () => void;
  title: string;
  backHref?: string;
  backLabel?: string;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

export const QueryErrorFallback = ({
  error,
  resetErrorBoundary,
  title,
  backHref,
  backLabel = "Back",
}: QueryErrorFallbackProps) => {
  const router = useRouter();
  const message = getErrorMessage(error);
  const isNotFound = /not found|no record was found|required but not found/i.test(
    message,
  );
  const isUnauthorized = /unauthorized|forbidden/i.test(message);

  const handleBack = () => {
    // Always prefer explicit backHref
    if (backHref) {
      router.push(backHref);
      return;
    }
    
    // Fallback: try to go back in browser history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Last resort: go to dashboard
      router.push("/workflows");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card/80 p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-5" />
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {isNotFound ? "This item was not found" : title}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isUnauthorized
            ? "Your session may have expired. Please sign in again."
            : isNotFound
              ? "It may have been deleted or you may not have access to it anymore."
              : "Something went wrong while loading this view. Please try again."}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {!isUnauthorized && (
            <Button
              variant="outline"
              size="sm"
              className="hover:translate-y-0"
              onClick={resetErrorBoundary}
            >
              <RefreshCcwIcon className="size-4" />
              Try again
            </Button>
          )}

          {isUnauthorized ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.replace("/login")}
            >
              <ArrowLeftIcon className="size-4" />
              Sign in
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleBack}>
              <ArrowLeftIcon className="size-4" />
              {backLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
