"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { InquiryStatus } from "@/app/api/inquiries/route";
import { updateInquiryStatus, saveInquiryNote } from "./actions";

const STATUS_META: Record<
  InquiryStatus,
  { label: string; dot: string; pill: string }
> = {
  new: {
    label: "New",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-800 border border-slate-200",
  },
  open: {
    label: "Open",
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  shared: {
    label: "Details Shared",
    dot: "bg-terracotta",
    pill: "bg-orange-50 text-terracotta border border-terracotta/40",
  },
  closed: {
    label: "Closed",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
};

const STATUSES: InquiryStatus[] = ["new", "open", "shared", "closed"];

export function StatusControl({
  id,
  initialStatus = "new",
  initialNote = "",
}: {
  id: string;
  initialStatus?: InquiryStatus;
  initialNote?: string;
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
    setStatus(next); // optimistic
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

  const meta = STATUS_META[status];

  return (
    <div className="flex flex-col gap-2">
      {/* Status dropdown */}
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

      {/* Internal team note */}
      <div className="grid gap-1">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={persistNote}
          placeholder="Add an internal note (e.g. 'Shared 3 villa options on WhatsApp')"
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        {(notePending || note !== savedNote) && (
          <p className="text-[10px] text-muted-foreground">
            {notePending ? "Saving…" : "Click outside to save"}
          </p>
        )}
      </div>
    </div>
  );
}

export { STATUS_META };
