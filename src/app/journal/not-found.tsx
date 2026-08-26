import Link from "next/link";

export default function JournalNotFound() {
  return (
    <div className="container-page grid min-h-[55vh] max-w-lg place-content-center py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The Earthy Journal</p>
      <h1 className="mt-3 font-serif text-4xl text-foreground">This story has wandered off</h1>
      <p className="mt-3 text-muted-foreground">
        The page you&apos;re looking for isn&apos;t here. It may have moved, or the link may be incomplete.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link href="/journal" className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-white">
          Back to the Journal
        </Link>
        <Link href="/journal/search" className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-forest hover:text-forest">
          Search stories
        </Link>
      </div>
    </div>
  );
}
