import { AuthLayout } from "@/features/auth/components/auth-layout";
import Image from "next/image";
import Link from "next/link";

export const layout = ({ children }: { children: React.ReactNode }) => {
  return <AuthLayout>{children}</AuthLayout>;
};
export default layout;
