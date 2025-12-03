import { requireAuth } from "@/lib/auth-utils";


const page = async() => {
  await requireAuth();
  return (
    <div>
      credentials page
    </div>
  )
}

export default page;
