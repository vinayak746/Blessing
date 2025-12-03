import { requireAuth } from "@/lib/auth-utils"


const page = async() => {
  await requireAuth();
  return (
    <div>
      workflows page
    </div>
  )
}

export default page
