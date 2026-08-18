"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { formatINR } from "@/lib/format";

const WHATSAPP_E164 = "919657100004";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function ExperienceInquiryCard({
  experienceSlug,
  experienceName,
  priceFrom,
  city,
}: {
  experienceSlug: string;
  experienceName: string;
  priceFrom?: number;
  city?: string;
}) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarPos, setCalendarPos] = useState<{ top: number; left: number } | null>(null);
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const datePopoverRef = useRef<HTMLDivElement>(null);
  const calendarPopoverRef = useRef<HTMLDivElement>(null);

  // The card that holds this field has `overflow-hidden` (for its two-tone
  // header), which would clip the calendar's later rows if it stayed a DOM
  // descendant. It's portaled to <body> and positioned in viewport
  // coordinates instead, so it always renders in full regardless of any
  // ancestor's overflow or the card's own height. It also flips above the
  // field when there isn't room below, so it's never cut off by the bottom
  // of the screen either — using the popover's real height once mounted,
  // falling back to a generous estimate for the very first placement.
  function reposition() {
    const rect = datePopoverRef.current?.getBoundingClientRect();
    if (!rect) return;
    const popoverHeight = calendarPopoverRef.current?.offsetHeight ?? 420;
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const top =
      spaceBelow >= popoverHeight + margin || spaceBelow >= spaceAbove
        ? rect.bottom + margin
        : rect.top - popoverHeight - margin;
    setCalendarPos({ top: Math.max(margin, top), left: rect.left + rect.width / 2 });
  }

  useEffect(() => {
    if (!calendarOpen) return;
    reposition();
    // Re-measure on the next frame once the popover has actually mounted —
    // the first pass above uses an estimated height for the flip decision.
    const raf = requestAnimationFrame(reposition);
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (datePopoverRef.current?.contains(t)) return;
      if (calendarPopoverRef.current?.contains(t)) return;
      setCalendarOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setCalendarOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarOpen]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    toast.dismiss(); // clear any stale validation toast before re-validating
    if (name.trim().length < 2) return toast.error("Please share your name.");
    if (phone.trim().length < 7)
      return toast.error("Please share a reachable phone number.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "experience",
          experience: experienceSlug,
          name: name.trim(),
          phone: phone.trim(),
          checkIn: date ? format(date, "yyyy-MM-dd") : undefined,
          guests,
          message: `Experience: ${experienceName}`,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setDone(true);
      toast.success("Inquiry received — our team will be in touch shortly.");
    } catch {
      toast.error(
        "Something went wrong. Please try again or WhatsApp us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const waText = encodeURIComponent(
    `Hi Earthy Stays, I'd like to know more about "${experienceName}"${
      city ? ` in ${city}` : ""
    }.`,
  );
  const waHref = `https://wa.me/${WHATSAPP_E164}?text=${waText}`;

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
        <BadgeCheck className="mx-auto h-10 w-10 text-primary" strokeWidth={1.5} />
        <h3 className="mt-3 font-display text-2xl">Inquiry sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks {name.split(" ")[0]}! Our team usually replies within a few
          hours. For anything urgent, message us on WhatsApp.
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-5 text-[16px] font-medium text-primary transition hover:bg-primary/5"
        >
          <WhatsAppGlyph className="h-4 w-4" />
          Chat on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Price + trust — soft beige header */}
      <div className="bg-sand/60 px-7 pb-6 pt-7">
        {typeof priceFrom === "number" && (
          <div className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Starting from
            </p>
            <p className="mt-1 font-numeric text-[44px] font-bold leading-none tabular-nums text-foreground">
              {formatINR(priceFrom)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / person
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Inquiry fields — white body */}
      <form onSubmit={submit} className="space-y-3.5 px-7 pb-7 pt-5">
        <div ref={datePopoverRef} className="relative grid grid-cols-2 gap-2.5">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              aria-label="Date"
              className="flex h-12 w-full items-center rounded-xl border border-border bg-background pl-9 pr-2 text-left text-[15px] outline-none transition-colors focus:border-primary"
            >
              <span className={date ? "text-foreground" : "text-muted-foreground"}>
                {date ? format(date, "d MMM yyyy") : "Date"}
              </span>
            </button>
          </div>

          {calendarOpen &&
            calendarPos &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={calendarPopoverRef}
                className="rdp-popover fixed z-[100] w-max -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xl"
                style={
                  {
                    top: calendarPos.top,
                    left: calendarPos.left,
                    "--rdp-day-height": "44px",
                    "--rdp-day-width": "44px",
                    "--rdp-cell-size": "44px",
                  } as React.CSSProperties
                }
              >
                <DayPicker
                  mode="single"
                  weekStartsOn={1}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                  disabled={{ before: today }}
                  modifiers={{ weekend: { dayOfWeek: [0, 6] } }}
                  modifiersClassNames={{ weekend: "rdp-weekend" }}
                  components={{
                    Chevron: ({ orientation }) =>
                      orientation === "left" ? (
                        <ChevronLeft className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ),
                  }}
                />
              </div>,
              document.body,
            )}
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              aria-label="Guests"
              className="h-12 w-full appearance-none rounded-xl border border-border bg-background pl-9 pr-8 text-[15px] text-foreground outline-none transition-colors focus:border-primary"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} guest{n === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className={field}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          inputMode="tel"
          autoComplete="tel"
          className={field}
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-primary text-[16px] font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send Inquiry"}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-background text-[16px] font-medium text-primary transition hover:bg-primary/5"
        >
          <WhatsAppGlyph className="h-4 w-4" />
          WhatsApp Inquiry
        </a>
      </form>
    </div>
  );
}

const field =
  "h-12 w-full rounded-xl border border-border bg-background px-3.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
