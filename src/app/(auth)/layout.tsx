import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Toaster } from "sonner";

export const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AuthLayout>{children}</AuthLayout>
      <Toaster />
    </>
  );
};
export default layout;
