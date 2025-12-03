import { requireAuth } from "@/lib/auth-utils";

interface pageProps {
    params: Promise<{
        credentialId: string
    }>
}

const page = async({params}: pageProps) => {
    const {credentialId} = await params;
    await requireAuth();
  return (
    <div>
      <p>credentials id: {credentialId}</p>
    </div>
  )
}

export default page
