import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/landing-page";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/workflows");
  return <LandingPageClient />;
}
