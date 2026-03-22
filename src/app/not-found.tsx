import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFound() {
  const referrer = (await headers()).get("referer") || "";
  const target = referrer.includes("/executions")
    ? "/executions"
    : referrer.includes("/credentials")
      ? "/credentials"
      : referrer.includes("/workflows")
        ? "/workflows"
        : "/workflows"; // default to workflows if unknown

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Not Found</h2>
      <p className="text-muted-foreground">
        Could not find the requested resource.
      </p>
      <Link
        href={target}
        className="text-sm underline underline-offset-4 hover:text-primary"
      >
        Return to {target.replace("/", "") || "workflows"}
      </Link>
    </div>
  );
}
