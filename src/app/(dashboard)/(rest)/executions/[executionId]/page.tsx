import { requireAuth } from "@/lib/auth-utils";

interface pageProps {
    params: Promise<{
        executionId: string
    }>
}

const page = async({params}: pageProps) => {
    const {executionId} = await params;
    await requireAuth();
  return (
    <div>
      <p>Exectution id: {executionId}</p>
    </div>
  )
}

export default page
