import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="bg-[#12100c] dark:bg-[#0a0805] text-[#c2ad7a] dark:text-[#a89668] py-16 px-6 border-t border-[#3c321d] dark:border-[#1f1a10]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-[#fdfaf3]"
          >
            <Image
              src="/logos/logo.png"
              alt="Blessing"
              width={36}
              height={36}
              className="rounded-md"
            />
            <span className="text-[#d4af37]">Blessing</span>
          </Link>
          <p className="text-sm leading-relaxed max-w-xs">
            The intelligent workflow automation platform for modern teams.
            Build, automate, and scale with confidence.
          </p>
        </div>

        {[
          {
            heading: "Product",
            links: [
              { label: "Features", href: "/#features" },
              { label: "Integrations", href: "/#integrations" },
              { label: "Changelog", href: "/" },
            ],
          },
          {
            heading: "Resources",
            links: [
              { label: "Documentation", href: "/" },
              { label: "Blog", href: "/" },
              { label: "Community", href: "/" },
              { label: "Status", href: "/" },
            ],
          },
          {
            heading: "Company",
            links: [
              { label: "About", href: "/" },
              { label: "Contact", href: "/" },
              { label: "Privacy", href: "/" },
              { label: "Terms", href: "/" },
            ],
          },
        ].map((col) => (
          <div key={col.heading} className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[#fdfaf3]">
              {col.heading}
            </h4>
            {col.links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm hover:text-[#fdfaf3] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#3c321d] dark:border-[#1f1a10] text-xs text-center">
        © {new Date().getFullYear()} Blessing. All rights reserved.
      </div>
    </footer>
  );
}
