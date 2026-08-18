"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import type { StoredInquiry } from "@/app/api/inquiries/route";
import { decideRequest, openThreadForInquiry } from "@/app/host/(dash)/bookings/actions";

function fmtDate(d?: string): string | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RequestCard({
  inquiry,
  listingName,
}: {
  inquiry: StoredInquiry;
  listingName?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [opening, startOpening] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState(inquiry.hostDecision);

  function decide(d: "accepted" | "declined") {
    setError(null);
    startTransition(async () => {
      const res = await decideRequest(inquiry.id, d);
      if (!res.ok) setError(res.error ?? "Something went wrong");
      else setDecision(d);
    });
  }

  function message() {
    setError(null);
    startOpening(async () => {
      const res = await openThreadForInquiry(inquiry.id);
      if (!res.ok || !res.threadId) setError(res.error ?? "Something went wrong");
      else router.push(`/host/inbox?thread=${res.threadId}`);
    });
  }

  const checkIn = fmtDate(inquiry.checkIn);
  const checkOut = fmtDate(inquiry.checkOut);
  const dates = checkIn && checkOut ? `${checkIn} – ${checkOut}` : checkIn ?? "Dates flexible";

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">
          {inquiry.name}
          {listingName && <span className="font-normal text-muted-foreground"> · {listingName}</span>}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {dates}
          {inquiry.guests ? ` · ${inquiry.guests} guest${inquiry.guests === 1 ? "" : "s"}` : ""}
        </p>
        {inquiry.message && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">“{inquiry.message}”</p>
        )}
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {inquiry.guestUserId && (
          <button
            type="button"
            disabled={opening}
            onClick={message}
            title="Message guest"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-60"
          >
            {opening ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            Message
          </button>
        )}
        {decision === "accepted" ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Accepted — concierge is confirming
          </span>
        ) : decision === "declined" ? (
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Declined
          </span>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("accepted")}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Accept
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("declined")}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-60"
            >
              Decline
            </button>
          </>
        )}
      </div>
    </div>
  );
}
