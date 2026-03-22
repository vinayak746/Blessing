import { AppHeader } from "@/components/app-header";

const layout = ({children}:{children: React.ReactNode;}) => {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default layout
