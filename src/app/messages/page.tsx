import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getThreadsForGuest, unreadCount } from "@/lib/data/messages";
import { getUsers } from "@/lib/data/users";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My messages" };

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function GuestMessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");

  const [threads, users] = await Promise.all([getThreadsForGuest(user.id), getUsers()]);
  const hostNameById = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="container-page py-10 lg:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My messages" }]} />
      <header className="mt-4">
        <h1 className="font-display text-4xl sm:text-5xl">My messages</h1>
        <p className="mt-2 text-muted-foreground">
          {threads.length === 0
            ? "Conversations with your hosts will appear here."
            : `${threads.length} ${threads.length === 1 ? "conversation" : "conversations"} with your hosts.`}
        </p>
      </header>

      {threads.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-2xl">No conversations yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            When you send a booking request, the host can message you here about your stay.
          </p>
          <Link
            href="/villas"
            className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse villas
          </Link>
        </div>
      ) : (
        <div className="mt-10 divide-y divide-border/70 rounded-2xl border border-border/70 bg-card/40">
          {threads.map((t) => {
            const unread = unreadCount(t, "guest");
            const last = t.messages[t.messages.length - 1];
            const villa = getVillaBySlugWithHidden(t.villaSlug);
            return (
              <Link
                key={t.id}
                href={`/messages/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] ${unread > 0 ? "font-semibold" : "font-medium"}`}>
                    {villa?.name ?? t.villaSlug}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {hostNameById.get(t.hostId) ?? "Host"}
                    </span>
                  </p>
                  <p
                    className={`mt-0.5 truncate text-sm ${
                      unread > 0 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {last
                      ? `${last.sender === "guest" ? "You: " : ""}${last.body}`
                      : "No messages yet"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs text-muted-foreground">{fmtWhen(t.lastMessageAt)}</span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
