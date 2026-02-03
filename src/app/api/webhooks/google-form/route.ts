import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest){
    try{
        const url = new URL(request.url);
        const workflowId = url.searchParams.get("workflowId");

    if(!workflowId){
        return NextResponse.json(
            {success: false, error: "Missing required query parameter: workflowId"},
            {status: 400},
        );
    };

    // Security: Verify the workflow exists
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, userId: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

     const body = await request.json();

     const formData = {
        formId: body.formId,
        formTitle: body.formTitle,
        responseId: body.responseId,
        timestamp: body.timestamp,
        respondentEmail: body.respondentEmail,
        responses: body.responses,
        raw: body,
     };
     // Trigger an Inngest job
     await sendWorkflowExecution({
        workflowId,
        initialData:{
            googleForm: formData,
        }
     })
        return NextResponse.json({success: true}, {status: 200});
    }catch(error){
        console.error("Google form webhook error:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            {success: false, error: "Failed to process Google Form submission"},
            {status: 500},
        )
    }
}