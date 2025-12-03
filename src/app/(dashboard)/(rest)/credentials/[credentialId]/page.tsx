import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        credentialId: string
    }>
}

const Page = async({params}: PageProps) => {
    const {credentialId} = await params;
    await requireAuth();
  return (
    <div>
      <p>credentials id: {credentialId}</p>
    </div>
  )
}

export default Page
