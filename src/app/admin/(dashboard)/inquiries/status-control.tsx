"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { InquiryStatus } from "@/app/api/inquiries/route";
import { updateInquiryStatus, saveInquiryNote } from "./actions";

/**
 * Six-step display pipeline. Legacy stored values (`shared`, `closed`)
 * are mapped to their new counterparts on read so old data keeps rendering
 * cleanly. Anything new the admin writes uses the canonical six.
 */
const STATUS_META: Record<
  InquiryStatus,
  { label: string; dot: string; pill: string }
> = {
  new: {
    label: "New",
    dot: "bg-[#B84A45]",
    pill: "bg-[#F6D8D4] text-[#B84A45] border border-transparent",
  },
  open: {
    label: "Open",
    dot: "bg-[#B36B1E]",
    pill: "bg-[#F5E3CC] text-[#B36B1E] border border-transparent",
  },
  "quote-sent": {
    label: "Quote Sent",
    dot: "bg-[#6B5091]",
    pill: "bg-[#EDE5F7] text-[#6B5091] border border-transparent",
  },
  negotiating: {
    label: "Negotiating",
    dot: "bg-[#D9855A]",
    pill: "bg-[#F9DAC8] text-[#D9855A] border border-transparent",
  },
  booked: {
    label: "Booked",
    dot: "bg-[#3E6B4C]",
    pill: "bg-[#D8E9DD] text-[#3E6B4C] border border-transparent",
  },
  lost: {
    label: "Lost",
    dot: "bg-[#8A6B5F]",
    pill: "bg-[#E5D5CD] text-[#8A6B5F] border border-transparent",
  },
  shared: {
    label: "Quote Sent",
    dot: "bg-[#6B5091]",
    pill: "bg-[#EDE5F7] text-[#6B5091] border border-transparent",
  },
  closed: {
    label: "Booked",
    dot: "bg-[#3E6B4C]",
    pill: "bg-[#D8E9DD] text-[#3E6B4C] border border-transparent",
  },
};

const STATUSES: InquiryStatus[] = [
  "new",
  "open",
  "quote-sent",
  "negotiating",
  "booked",
  "lost",
];

export function StatusControl({
  id,
  initialStatus = "new",
  initialNote = "",
  showNote = true,
}: {
  id: string;
  initialStatus?: InquiryStatus;
  initialNote?: string;
  /** When rendered in a compact row context, suppress the note textarea
   *  so the row stays a single line. Detail panel keeps it visible. */
  showNote?: boolean;
}) {
  const [status, setStatus] = useState<InquiryStatus>(initialStatus);
  const [note, setNote] = useState<string>(initialNote);
  const [savedNote, setSavedNote] = useState<string>(initialNote);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [notePending, startNote] = useTransition();

  function change(next: InquiryStatus) {
    setOpen(false);
    if (next === status) return;
    const prev = status;
    setStatus(next);
    start(async () => {
      const res = await updateInquiryStatus(id, next);
      if (!res.ok) {
        setStatus(prev);
        toast.error(res.error ?? "Could not update");
      } else {
        toast.success(`Marked as ${STATUS_META[next].label}`);
      }
    });
  }

  function persistNote() {
    if (note === savedNote) return;
    const prev = savedNote;
    startNote(async () => {
      const res = await saveInquiryNote(id, note);
      if (!res.ok) {
        setNote(prev);
        toast.error("Could not save note");
      } else {
        setSavedNote(note);
        toast.success("Note saved");
      }
    });
  }

  // Viewing a "new" inquiry's detail panel is how the admin "opens" it —
  // mirror that in the pipeline status so it stops showing as New once
  // someone has actually looked at it.
  useEffect(() => {
    if (initialStatus === "new") change("open");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meta = STATUS_META[status];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={pending}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${meta.pill}`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 cursor-default"
            />
            <ul className="absolute left-0 top-full z-40 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {STATUSES.map((s) => {
                const m = STATUS_META[s];
                const active = s === status;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => change(s)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted ${
                        active ? "bg-muted/60" : ""
                      }`}
                    >
                      <span className={`inline-block h-2 w-2 rounded-full ${m.dot}`} />
                      <span className="flex-1">{m.label}</span>
                      {active && <Check className="h-3.5 w-3.5 text-foreground" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {showNote && (
        <div className="grid gap-1">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={persistNote}
            placeholder="Add an internal note (e.g. 'Shared 3 villa options on WhatsApp')"
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {(notePending || note !== savedNote) && (
            <p className="text-[10px] text-muted-foreground">
              {notePending ? "Saving…" : "Click outside to save"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { STATUS_META };
