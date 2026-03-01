"use client";

import dynamic from "next/dynamic";

const NewsletterAdmin = dynamic(
  () => import("@/components/newsletter-admin"),
  { ssr: false }
);

export default function NewsletterAdminClient() {
  return <NewsletterAdmin />;
}
