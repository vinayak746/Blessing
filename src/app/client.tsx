"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { trpc } from "../trpc/server";
import { useTRPC } from "@/trpc/client";

export const Client = () => {
  const trpc = useTRPC();
  const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
  return <div>{JSON.stringify(users)}</div>;
};
