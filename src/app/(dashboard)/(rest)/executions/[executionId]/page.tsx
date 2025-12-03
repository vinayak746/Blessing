import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        executionId: string
    }>
}

const Page = async({params}: PageProps) => {
    const {executionId} = await params;
    await requireAuth();
  return (
    <div>
      <p>Exectution id: {executionId}</p>
    </div>
  )
}

export default Page
