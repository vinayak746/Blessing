import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LandingPage from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Blessing — Workflow Automation Platform",
  description:
    "Connect your apps, orchestrate complex workflows, and eliminate manual tasks with an intelligent no-code automation engine. Built for teams that demand excellence.",
  openGraph: {
    title: "Blessing — Workflow Automation Platform",
    description:
      "Connect your apps, orchestrate complex workflows, and eliminate manual tasks with an intelligent no-code automation engine.",
    type: "website",
  },
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/workflows");
  return <LandingPage />;
}
