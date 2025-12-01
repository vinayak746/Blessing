"use client";

import { requireAuth } from "@/lib/auth-utils";
import { caller } from "@/trpc/server";
import { LogoutButton } from "./logout";
import { useTRPC } from "@/trpc/client";

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Page =  () => {
  const trpc = useTRPC();
  const{data} = useQuery(trpc.getWorkflows.queryOptions());
  const queryClient =  useQueryClient();

  const testAi = useMutation(trpc.testAi.mutationOptions({
    onSuccess:() => {
      toast.success(" AI Job queued successfully");
    }
  }));

  const create = useMutation(trpc.createWorkflow.mutationOptions({
    onSuccess:() => {
      toast.success("Job queued successfully");
    }
  }));
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center flex-col gap-y-6">
      <div>
        protected page
        {JSON.stringify(data, null, 2)}
      </div>
      <Button disabled={testAi.isPending} onClick={()=>testAi.mutate()}>
        Test AI
      </Button>
      <Button disabled={create.isPending} onClick={()=>create.mutate()}>
        Create Workflow
      </Button>
      <LogoutButton />
    </div>
  );
};

export default Page;
