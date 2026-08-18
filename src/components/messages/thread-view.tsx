"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import type { ThreadMessage, ThreadViewer } from "@/lib/data/messages";

const POLL_MS = 5000;

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ThreadView({
  threadId,
  viewer,
  counterpartName,
  initialMessages,
}: {
  threadId: string;
  viewer: ThreadViewer;
  counterpartName: string;
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(initialMessages.length);

  // Poll for new messages while the thread is open.
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${threadId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: ThreadMessage[] };
        if (data.messages && data.messages.length !== countRef.current) {
          countRef.current = data.messages.length;
          setMessages(data.messages);
        }
      } catch {
        // transient network failure — next poll will retry
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setError(null);
    startSending(async () => {
      try {
        const res = await fetch(`/api/messages/${threadId}`, {
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
          countRef.current = data.messages.length;
          setMessages(data.messages);
        }
        setDraft("");
      } catch {
        setError("Couldn't send — check your connection and try again.");
      }
    });
  }

  return (
    <div className="flex min-h-[420px] flex-col rounded-2xl border border-border/70 bg-background">
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello to {counterpartName}.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === viewer;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[65%] ${
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-1 text-[11px] ${
                      mine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {fmtTime(m.at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/70 px-4 py-3">
        {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
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
            placeholder={`Message ${counterpartName}…`}
            className="max-h-32 min-h-[42px] flex-1 resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            aria-label="Send message"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Keep the conversation on Earthy Stays — the concierge team can step in whenever you need help.
        </p>
      </div>
    </div>
  );
}
