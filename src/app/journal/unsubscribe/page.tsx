import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribeByToken } from "@/lib/data/journal-newsletter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe — The Earthy Journal",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await unsubscribeByToken(token) : false;

  return (
    <div className="container-page grid min-h-[50vh] max-w-lg place-content-center py-16 text-center">
      {ok ? (
        <>
          <h1 className="font-serif text-3xl text-foreground">You&apos;re unsubscribed</h1>
          <p className="mt-3 text-muted-foreground">
            You won&apos;t receive any more emails from the Earthy Journal. Changed your mind?
            You can resubscribe any time from the Journal.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif text-3xl text-foreground">Link not recognised</h1>
          <p className="mt-3 text-muted-foreground">
            This unsubscribe link is invalid or has already been used.
          </p>
        </>
      )}
      <Link href="/journal" className="mx-auto mt-6 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-medium text-white">
        Back to the Journal
      </Link>
    </div>
  );
}
