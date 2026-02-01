import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"


const layout = ({children}:{children: React.ReactNode;}) => {
  return (
    <div>
      <CommandPalette>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-accent/20">
              {children}
          </SidebarInset>
        </SidebarProvider>
      </CommandPalette>
    </div>
  )
}

export default layout
