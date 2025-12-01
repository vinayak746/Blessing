import { inngest } from "@/inngest/client";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";


export const appRouter = createTRPCRouter({
  testAi: protectedProcedure.mutation(async()=>{
    
    await inngest.send({
      name: "execute/ai",
    })
    return {success:true, message:"AI job queued"};
  }),
  getWorkflows: protectedProcedure.query(({ ctx }) => {
    return prisma.workflow.findMany();
  }),
  createWorkflow: protectedProcedure.mutation(async()=>{
    await inngest.send({
      name:"test/hello.world",
      data:{
        email:"vinayakarora7461@gmail.com"
      },

    })
    return {success:true, message:"job queued"};
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
