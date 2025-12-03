import { requireAuth } from "@/lib/auth-utils"


const page = async() => {
  await requireAuth();
  return (
    <div>
    executions page
    </div>
  )
}

export default page
