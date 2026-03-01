import Link from "next/link";
import Image from "next/image";

export default function NewsletterConfirmed() {
  return (
    <div className="min-h-screen bg-[#fdfaf3] flex flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <Image
          src="/logos/logo.png"
          alt="Blessing"
          width={48}
          height={48}
          className="rounded-xl"
        />
        <span className="font-bold text-2xl tracking-tight text-[#1a1408]">
          Blessing
        </span>
      </Link>

      <div className="bg-[#fffdf6] border border-[#e3d4aa] rounded-2xl p-10 max-w-md w-full flex flex-col items-center gap-5 shadow-sm">
        <span className="text-6xl">🎉</span>
        <h1 className="text-3xl font-bold text-[#1a1408]">
          You&apos;re subscribed!
        </h1>
        <p className="text-[#746641] text-sm leading-relaxed max-w-xs">
          Thanks for confirming your email. You&apos;ll now receive automation
          tips, new integrations, and early access to upcoming features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#1a1408] text-[#fdfaf3] font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#8B5A2B] transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/workflows"
            className="inline-flex items-center justify-center gap-2 border border-[#e3d4aa] text-[#1a1408] font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#f7f3ea] transition-colors"
          >
            Try Blessing →
          </Link>
        </div>
      </div>
    </div>
  );
}
