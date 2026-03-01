import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import NewsletterAdminClient from "./newsletter-admin-client";

export default async function NewsletterAdminPage() {
  const session = await requireAuth();

  // Only allow the admin to access this page
  if (session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  return <NewsletterAdminClient />;
}
