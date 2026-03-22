import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/auth-utils";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "sonner";
import { Provider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next";
import { headers } from "next/headers";


const layout = async ({children}:{children: React.ReactNode;}) => {
  const session = await requireAuth();
  const isAdmin = session.user?.email === process.env.ADMIN_EMAIL;
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";

  return (
    <TRPCReactProvider requestHeaders={{ cookie }}>
      <NuqsAdapter>
        <Provider>
          <CommandPalette>
            <SidebarProvider>
              <AppSidebar isAdmin={isAdmin} />
              <SidebarInset className="bg-accent/20 dark-dashboard-bg">
                  {children}
              </SidebarInset>
            </SidebarProvider>
          </CommandPalette>
          <Toaster />
        </Provider>
      </NuqsAdapter>
    </TRPCReactProvider>
  )
}

export default layout
