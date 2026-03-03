import Link from "next/link";
import Image from "next/image";

export default function NewsletterUnsubscribed() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <Image
          src="/logos/logo.png"
          alt="Blessing"
          width={48}
          height={48}
          className="rounded-xl"
        />
        <span className="font-bold text-2xl tracking-tight text-foreground">
          Blessing
        </span>
      </Link>

      <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full flex flex-col items-center gap-5 shadow-sm">
        <span className="text-6xl">👋</span>
        <h1 className="text-3xl font-bold text-foreground">
          You&apos;ve been unsubscribed
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          We&apos;re sorry to see you go. You will no longer receive newsletter
          emails from us. If this was a mistake, you can always re-subscribe
          from our homepage.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
