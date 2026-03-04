import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLayout>{children}</AuthLayout>
      <Toaster />
    </>
  );
}
