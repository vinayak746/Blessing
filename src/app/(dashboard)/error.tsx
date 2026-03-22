"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, LogInIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isUnauthorizedError } from "@/lib/error-utils";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isUnauthorized = isUnauthorizedError(error);

  useEffect(() => {
    if (isUnauthorized) {
      router.replace("/login");
    }
  }, [isUnauthorized, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-5" />
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {isUnauthorized ? "Session expired" : "Something went wrong"}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {isUnauthorized
            ? "Redirecting to sign in..."
            : "An unexpected error occurred while loading this page."}
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          {isUnauthorized ? (
            <Button size="sm" onClick={() => router.replace("/login")}>
              <LogInIcon className="size-4" />
              Sign in
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={reset}>
              <RefreshCcwIcon className="size-4" />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
