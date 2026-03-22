"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { useCommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";

export const AppHeader = () => {
  const { setOpen } = useCommandPalette();

  return (
    <header className="flex h-[3.75rem] shrink-0 items-center gap-2.5 border-b border-border px-4 md:px-5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger />
      <div className="flex-1" />
      <ThemeToggle />
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex items-center gap-2 text-foreground/75 dark:text-muted-foreground border-border bg-card/70 hover:bg-accent/60 hover:border-primary/65 hover:text-foreground hover:translate-y-0 focus-visible:ring-primary/55"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
        <span className="text-sm font-medium">Search...</span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border border-border/80 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Open search"
        className="md:hidden border-border bg-card/70 hover:bg-accent/60 hover:border-primary/65 hover:translate-y-0 focus-visible:ring-primary/55"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
      </Button>
    </header>
  );
};
