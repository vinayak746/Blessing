import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

const getSafeSession = async () => {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("getSafeSession auth.api.getSession failed", error);
    return null;
  }
};

export const requireAuth = async () => {
  const session = await getSafeSession();

  if (!session) {
    redirect("/login");
  }

  return session;
};

export const requireUnauth = async () => {
  const session = await getSafeSession();

  if (session) {
    redirect("/");
  }
};
