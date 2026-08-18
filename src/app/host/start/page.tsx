import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/host-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hosting · Earthy Stays" };

export default async function HostStartPage() {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-5">
          <Link href="/" aria-label="Earthy Stays home">
            <Image src="/brand/logo.png" alt="Earthy Stays" width={120} height={94} className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Hosting is by invitation</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Earthy Stays curates every home in the collection ourselves, so hosting access is
          granted directly by our team rather than through self-signup. If you&apos;d like to
          list your villa or apartment with us, reach out and we&apos;ll take it from there.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Signed in as {user.email}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/partner"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Get in touch
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
