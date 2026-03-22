"use client";

import {
  CreditCardIcon,
  FolderOpenIcon,
  HistoryIcon,
  KeyIcon,
  LogOutIcon,
  NewspaperIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription";
const menutItems = [
  {
    title: "Main",
    items: [
      {
        title: "Workflows",
        icon: FolderOpenIcon,
        url: "/workflows",
      },
      {
        title: "Credentials",
        icon: KeyIcon,
        url: "/credentials",
      },
      {
        title: "Executions",
        icon: HistoryIcon,
        url: "/executions",
      },
    ],
  },
];

const menuButtonClassName =
  "relative isolate gap-x-4 h-10 px-4 rounded-lg border border-transparent transition-all duration-200 hover:bg-sidebar-accent/80 hover:border-sidebar-border/70 hover:-translate-y-px dark:hover:border-sidebar-border/45 focus-visible:ring-2 focus-visible:ring-sidebar-ring/55 data-[active=true]:border-sidebar-border/85 dark:data-[active=true]:border-sidebar-border/55 data-[active=true]:bg-sidebar-accent/90 data-[active=true]:text-sidebar-accent-foreground before:absolute before:left-1.5 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity before:duration-200 data-[active=true]:before:opacity-100";

export const AppSidebar = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { hasActiveSubscription, isLoading } = useHasActiveSubscription();
  const { data: session } = authClient.useSession();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/70 pb-3.5">
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="gap-x-4 h-11 px-4 rounded-lg hover:bg-sidebar-accent/80">
            <Link prefetch href={"/"}>
              <Image
                src="/logos/logo.png"
                alt="Blessing"
                width={60}
                height={60}
                priority
              />
              <span className="font-semibold text-lg">Blessing</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent>
        {menutItems.map((group) => (
          <SidebarGroup key={group.title} className="px-2 py-1.5">
            <SidebarGroupLabel className="h-7 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => {
                  const isActive =
                    item.url === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        asChild
                        className={menuButtonClassName}
                      >
                        <Link href={item.url} prefetch aria-current={isActive ? "page" : undefined}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Newsletter"
                      isActive={pathname.startsWith("/newsletter-admin")}
                      asChild
                      className={menuButtonClassName}
                    >
                      <Link href="/newsletter-admin" prefetch aria-current={pathname.startsWith("/newsletter-admin") ? "page" : undefined}>
                        <NewspaperIcon className="size-4" />
                        <span>Newsletter</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 pt-3">
        <SidebarMenu>
          {!hasActiveSubscription && !isLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Upgrade to Pro"
                className="gap-x-4 h-10 px-4 rounded-lg border border-sidebar-primary/35 bg-sidebar-primary/10 text-sidebar-foreground hover:bg-sidebar-primary/20"
                onClick={() => authClient.checkout({ slug: "pro" })}
              >
                <StarIcon className="h-4 w-4" />
                <span>Upgrade to Pro</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Billing Portal"
              className="gap-x-4 h-10 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80 hover:-translate-y-px"
              onClick={() => authClient.customer.portal()}
            >
              <CreditCardIcon className="h-4 w-4" />
              <span>Billing Portal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="gap-x-4 h-10 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80 hover:-translate-y-px"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/login");
                    },
                  },
                })
              }
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
