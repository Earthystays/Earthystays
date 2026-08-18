import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getThread, markThreadRead } from "@/lib/data/messages";
import { findUserById } from "@/lib/data/users";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { ThreadView } from "@/components/messages/thread-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conversation" };

export default async function GuestThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const user = await getCurrentUser();
  const { threadId } = await params;
  if (!user) redirect(`/login?next=/messages/${threadId}`);

  const thread = await getThread(threadId);
  if (!thread || thread.guestUserId !== user.id) notFound();

  await markThreadRead(thread.id, "guest");

  const host = await findUserById(thread.hostId);
  const hostName = host?.name ?? "Your host";
  const villa = getVillaBySlugWithHidden(thread.villaSlug);

  return (
    <div className="container-page max-w-3xl py-8 lg:py-10">
      <Link
        href="/messages"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All messages
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-3xl sm:text-4xl">{hostName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your stay at{" "}
          {villa ? (
            <Link href={`/villas/${villa.slug}`} className="underline underline-offset-2 hover:text-foreground">
              {villa.name}
            </Link>
          ) : (
            thread.villaSlug
          )}
        </p>
      </header>

      <div className="mt-6">
        <ThreadView
          threadId={thread.id}
          viewer="guest"
          counterpartName={hostName.split(" ")[0]}
          initialMessages={thread.messages}
        />
      </div>
    </div>
  );
}
