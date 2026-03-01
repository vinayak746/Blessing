import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireAuth } from "@/lib/auth-utils";


const layout = async ({children}:{children: React.ReactNode;}) => {
  const session = await requireAuth();
  const isAdmin = session.user?.email === process.env.ADMIN_EMAIL;
  return (
    <div>
      <CommandPalette>
        <SidebarProvider>
          <AppSidebar isAdmin={isAdmin} />
          <SidebarInset className="bg-accent/20">
              {children}
          </SidebarInset>
        </SidebarProvider>
      </CommandPalette>
    </div>
  )
}

export default layout
