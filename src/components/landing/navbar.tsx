import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingNavbar() {
  return (
    <header className="animate-slide-down sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo.png"
            alt="Blessing"
            width={44}
            height={44}
            className="rounded-lg"
            priority
          />
          <span className="font-bold text-lg tracking-tight">Blessing</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How it works
          </Link>
          <Link
            href="#newsletter"
            className="hover:text-foreground transition-colors"
          >
            Newsletter
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-[#4A2010] dark:bg-primary text-[#fdfaf3] dark:text-primary-foreground px-4 py-2 rounded-lg hover:bg-[#6B3A1F] dark:hover:bg-[#c4a030] transition-all hover:scale-[1.03] active:scale-[0.97]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
