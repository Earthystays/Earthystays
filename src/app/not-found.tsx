import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-terracotta">
        Page not found
      </p>
      <h1 className="mt-4 font-display text-5xl sm:text-6xl">
        This path leads nowhere
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        The page you&apos;re looking for may have moved or never existed. Let&apos;s
        get you back to somewhere beautiful.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/villas"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Browse villas
        </Link>
        <Link
          href="/experiences"
          className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Explore experiences
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-terracotta underline underline-offset-4"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
