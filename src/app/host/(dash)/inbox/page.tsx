import { requireHost } from "@/lib/host-auth";
import { getThreadsForHost, unreadCount } from "@/lib/data/messages";
import { getUsers } from "@/lib/data/users";
import { getVillasByHost } from "@/lib/data/villas";
import { readJson } from "@/lib/storage";
import type { StoredInquiry } from "@/app/api/inquiries/route";
import { HostInbox, type InboxConversation } from "@/components/host/host-inbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox · Hosting" };

function nightsBetween(ci?: string, co?: string): number | undefined {
  if (!ci || !co) return undefined;
  const a = new Date(`${ci.slice(0, 10)}T00:00:00`);
  const b = new Date(`${co.slice(0, 10)}T00:00:00`);
  if (isNaN(a.getTime()) || isNaN(b.getTime()) || b <= a) return undefined;
  return Math.round((b.getTime() - a.getTime()) / 864e5);
}

export default async function HostInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const user = await requireHost();
  const sp = await searchParams;

  const [threads, users, inquiries] = await Promise.all([
    getThreadsForHost(user.id),
    getUsers(),
    readJson<StoredInquiry[]>("inquiries.json", []),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const villaBySlug = new Map(getVillasByHost(user.id).map((v) => [v.slug, v]));
  const inquiryById = new Map(inquiries.map((q) => [q.id, q]));

  const conversations: InboxConversation[] = threads.map((t) => {
    const guest = userById.get(t.guestUserId);
    const inquiry = inquiryById.get(t.inquiryId);
    const villa = villaBySlug.get(t.villaSlug);
    const nights = nightsBetween(inquiry?.checkIn, inquiry?.checkOut);
    return {
      threadId: t.id,
      guestName: guest?.name ?? inquiry?.name ?? "Guest",
      guestEmail: guest?.email ?? inquiry?.email,
      guestPhone: inquiry?.phone,
      villaName: villa?.name ?? t.villaSlug,
      villaSlug: t.villaSlug,
      checkIn: inquiry?.checkIn,
      checkOut: inquiry?.checkOut,
      guests: inquiry?.guests,
      bookingId: t.inquiryId,
      decision: inquiry?.hostDecision,
      specialRequest: inquiry?.message,
      nights,
      totalAmount: nights !== undefined && villa ? nights * villa.pricePerNight : undefined,
      unread: unreadCount(t, "host"),
      lastMessageAt: t.lastMessageAt,
      messages: t.messages,
    };
  });

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Inbox</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">All conversations with your guests</p>
      <div className="mt-6">
        <HostInbox conversations={conversations} initialThreadId={sp.thread} />
      </div>
    </div>
  );
}
