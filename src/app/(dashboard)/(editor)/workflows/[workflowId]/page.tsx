import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        workflowId: string
    }>
}

const Page = async({params}: PageProps) => {
    const {workflowId} = await params;
    await requireAuth();
  return (
    <div>
      <p>Workflow id: {workflowId}</p>
    </div>
  )
}

export default Page
