import { requireAuth } from "@/lib/auth-utils";

interface pageProps {
    params: Promise<{
        workflowId: string
    }>
}

const page = async({params}: pageProps) => {
    const {workflowId} = await params;
    await requireAuth();
  return (
    <div>
      <p>Workflow id: {workflowId}</p>
    </div>
  )
}

export default page
