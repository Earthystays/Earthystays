"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Home,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  SendHorizonal,
  Users,
} from "lucide-react";
import type { ThreadMessage } from "@/lib/data/messages";
import { formatINR } from "@/lib/format";

export type InboxConversation = {
  threadId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  villaName: string;
  villaSlug: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  bookingId: string;
  decision?: "accepted" | "declined";
  specialRequest?: string;
  nights?: number;
  totalAmount?: number;
  unread: number;
  lastMessageAt: string;
  messages: ThreadMessage[];
};

const QUICK_REPLIES: Array<{ label: string; text: string }> = [
  { label: "Early check-in info", text: "Early check-in is possible subject to availability — I'll confirm closer to your date. Standard check-in is 2:00 PM." },
  { label: "House rules", text: "A quick note on house rules: check-in 2 PM, check-out 11 AM, and no loud music after 10 PM. The full list is on the listing page." },
  { label: "WiFi details", text: "WiFi details will be on a card by the entrance when you arrive — network and password are also in your welcome note." },
  { label: "Directions", text: "I'll share a pinned location and directions the day before your arrival. The property is easy to find from the main road." },
  { label: "Thank you", text: "Thank you so much — it was a pleasure hosting you. We'd love to welcome you back!" },
];

function fmtDay(s?: string): string {
  if (!s) return "—";
  const d = new Date(`${s.slice(0, 10)}T00:00:00`);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function fmtListTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return fmtTime(iso);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-medium text-primary ${
        size === "lg" ? "h-11 w-11 text-sm" : "h-10 w-10 text-[13px]"
      }`}
    >
      {initials}
    </span>
  );
}

export function HostInbox({
  conversations: initial,
  initialThreadId,
}: {
  conversations: InboxConversation[];
  initialThreadId?: string;
}) {
  const [convos, setConvos] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialThreadId && initial.some((c) => c.threadId === initialThreadId)
      ? initialThreadId
      : null,
  );
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = convos.find((c) => c.threadId === selectedId) ?? null;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return convos
      .filter((c) => (tab === "unread" ? c.unread > 0 : true))
      .filter(
        (c) =>
          q.length === 0 ||
          c.guestName.toLowerCase().includes(q) ||
          c.villaName.toLowerCase().includes(q) ||
          c.messages.some((m) => m.body.toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
  }, [convos, tab, search]);

  const totalUnread = convos.reduce((n, c) => n + c.unread, 0);

  /* Opening a thread marks it read (the poll GET does it server-side). */
  function open(threadId: string) {
    setSelectedId(threadId);
    setError(null);
    setDraft("");
    setConvos((prev) => prev.map((c) => (c.threadId === threadId ? { ...c, unread: 0 } : c)));
  }

  /* Poll the open thread. */
  useEffect(() => {
    if (!selectedId) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/messages/${selectedId}`, { cache: "no-store" });
        if (!res.ok || stop) return;
        const data = (await res.json()) as { messages?: ThreadMessage[]; lastMessageAt?: string };
        if (!data.messages) return;
        setConvos((prev) =>
          prev.map((c) =>
            c.threadId === selectedId && c.messages.length !== data.messages!.length
              ? { ...c, messages: data.messages!, lastMessageAt: data.lastMessageAt ?? c.lastMessageAt, unread: 0 }
              : c,
          ),
        );
      } catch {
        /* transient — next poll retries */
      }
    };
    tick();
    const timer = setInterval(tick, 5000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [selected?.messages.length, selectedId]);

  function send() {
    const body = draft.trim();
    if (!body || !selectedId || sending) return;
    setError(null);
    startSending(async () => {
      try {
        const res = await fetch(`/api/messages/${selectedId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = (await res.json()) as { ok: boolean; messages?: ThreadMessage[]; error?: string };
        if (!data.ok) {
          setError(data.error ?? "Couldn't send — try again.");
          return;
        }
        if (data.messages) {
          setConvos((prev) =>
            prev.map((c) =>
              c.threadId === selectedId
                ? { ...c, messages: data.messages!, lastMessageAt: new Date().toISOString() }
                : c,
            ),
          );
        }
        setDraft("");
      } catch {
        setError("Couldn't send — check your connection.");
      }
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-160px)] overflow-hidden rounded-2xl border border-border/60 bg-background">
      {/* ── conversation list ─────────────────────────────── */}
      <div
        className={`w-full shrink-0 flex-col border-r border-border/60 md:flex md:w-[330px] ${
          selected ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-border/60 p-3">
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3.5 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-3 flex items-center gap-1 rounded-full border border-border/60 p-1">
            {(["all", "unread"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium capitalize ${
                  tab === t ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
                {t === "unread" && totalUnread > 0 && (
                  <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {totalUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <MessageSquare className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-muted-foreground">
                {convos.length === 0
                  ? "Conversations with guests appear here once you message them from a booking request."
                  : "No conversations match."}
              </p>
            </div>
          ) : (
            visible.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const active = c.threadId === selectedId;
              return (
                <button
                  key={c.threadId}
                  type="button"
                  onClick={() => open(c.threadId)}
                  className={`flex w-full items-start gap-3 border-b border-border/40 px-4 py-3.5 text-left transition-colors ${
                    active ? "bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <Avatar name={c.guestName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-[14.5px] ${c.unread > 0 ? "font-semibold" : "font-medium"}`}>
                        {c.guestName}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {fmtListTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`mt-0.5 truncate text-[13px] ${c.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {last ? `${last.sender === "host" ? "You: " : ""}${last.body}` : "No messages yet"}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground/80">{c.villaName}</p>
                      {c.unread > 0 && (
                        <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
          {visible.length > 0 && (
            <p className="py-5 text-center text-xs text-muted-foreground/70">No more conversations</p>
          )}
        </div>
      </div>

      {/* ── chat pane ─────────────────────────────────────── */}
      <div className={`min-w-0 flex-1 flex-col md:flex ${selected ? "flex" : "hidden"}`}>
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-muted-foreground">Select a conversation to read and reply.</p>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mr-1 rounded-full p-1 text-muted-foreground hover:bg-muted md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <Avatar name={selected.guestName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{selected.guestName}</p>
                <p className="truncate text-[13px] text-muted-foreground">{selected.villaName}</p>
              </div>
              <Link
                href="/host/bookings"
                className="hidden shrink-0 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium hover:bg-muted/50 sm:block"
              >
                View booking
              </Link>
            </div>

            {/* booking summary strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border/60 bg-muted/20 px-5 py-3">
              <SummaryItem icon={Calendar} label="Check-in" value={fmtDay(selected.checkIn)} />
              <SummaryItem icon={Calendar} label="Check-out" value={fmtDay(selected.checkOut)} />
              <SummaryItem icon={Users} label="Guests" value={selected.guests ? String(selected.guests) : "—"} />
              <SummaryItem icon={Home} label="Booking ID" value={selected.bookingId.replace(/^inq_/, "").slice(0, 10).toUpperCase()} />
              <span
                className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
                  selected.decision === "accepted"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : selected.decision === "declined"
                      ? "border border-border bg-muted text-muted-foreground"
                      : "border border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {selected.decision === "accepted" ? "Confirmed" : selected.decision === "declined" ? "Declined" : "Pending"}
              </span>
            </div>

            {/* messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {selected.messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No messages yet — say hello to {selected.guestName.split(" ")[0]}.
                </p>
              ) : (
                selected.messages.map((m) => {
                  const mine = m.sender === "host";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed sm:max-w-[70%] ${
                          mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-1 text-[11px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {fmtTime(m.at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* quick replies + composer */}
            <div className="border-t border-border/60 px-4 py-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">Quick replies</span>
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setDraft(q.text)}
                    className="shrink-0 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted/50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              {error && <p className="mb-1.5 text-sm text-destructive">{error}</p>}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Type your message…"
                  className="max-h-32 min-h-[42px] flex-1 resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14.5px] outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={sending || draft.trim().length === 0}
                  className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                  Send
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ── guest details rail ────────────────────────────── */}
      {selected && (
        <div className="hidden w-[270px] shrink-0 flex-col overflow-y-auto border-l border-border/60 xl:flex">
          <div className="border-b border-border/60 p-5">
            <p className="text-sm font-semibold">Guest details</p>
            <ul className="mt-3 space-y-2.5 text-[13.5px]">
              {selected.guestPhone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{selected.guestPhone}</span>
                </li>
              )}
              {selected.guestEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{selected.guestEmail}</span>
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{selected.guests ? `${selected.guests} guests` : "Guests —"}</span>
              </li>
            </ul>
          </div>

          {selected.specialRequest && (
            <div className="border-b border-border/60 p-5">
              <p className="text-sm font-semibold">Special requests</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                “{selected.specialRequest}”
              </p>
            </div>
          )}

          <div className="border-b border-border/60 p-5">
            <p className="text-sm font-semibold">Booking source</p>
            <p className="mt-2 text-[13.5px]">Direct · Earthy Stays</p>
            <p className="mt-4 text-sm font-semibold">Payment status</p>
            <p className="mt-2">
              <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Concierge settles offline
              </span>
            </p>
            {selected.totalAmount !== undefined && (
              <>
                <p className="mt-4 text-sm font-semibold">Total amount</p>
                <p className="mt-1 text-lg font-semibold">{formatINR(selected.totalAmount)}</p>
                {selected.nights !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {selected.nights} night{selected.nights === 1 ? "" : "s"} · indicative
                  </p>
                )}
              </>
            )}
          </div>

          <div className="p-5">
            <p className="text-sm font-semibold">Actions</p>
            <ul className="mt-3 space-y-1">
              {selected.guestPhone && (
                <li>
                  <a href={`tel:${selected.guestPhone.replace(/\s+/g, "")}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] hover:bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" /> Call guest
                  </a>
                </li>
              )}
              {selected.guestEmail && (
                <li>
                  <a href={`mailto:${selected.guestEmail}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] hover:bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" /> Email guest
                  </a>
                </li>
              )}
              <li>
                <Link href={`/villas/${selected.villaSlug}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] hover:bg-muted/50">
                  <Home className="h-4 w-4 text-muted-foreground" /> View listing
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium">{value}</span>
    </span>
  );
}
