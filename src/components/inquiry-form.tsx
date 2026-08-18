"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowRight, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker, type DateRange } from "@/components/date-range-picker";
import { GuestsPicker, DEFAULT_GUESTS, type Guests } from "@/components/guests-picker";
import { useUnitSelection } from "@/lib/unit-selection";

const InquirySchema = z.object({
  name: z.string().min(2, "Please share your name"),
  phone: z.string().min(7, "Please share a reachable phone number"),
  villa: z.string().optional(),
});

export type InquiryInput = z.infer<typeof InquirySchema>;

const WHATSAPP_E164 = "919657100004";

function toISO(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.52 1.74 6.49L3 29l6.68-1.75A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm0 23.6c-1.99 0-3.94-.53-5.64-1.55l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.55 10.55 0 0 1 5.4 16C5.4 10.15 10.15 5.4 16 5.4S26.6 10.15 26.6 16 21.85 26.6 16 26.6Zm5.83-7.94c-.32-.16-1.9-.94-2.19-1.05-.29-.11-.5-.16-.72.16-.21.32-.83 1.05-1.02 1.27-.19.21-.37.24-.69.08-.32-.16-1.36-.5-2.6-1.6-.96-.85-1.61-1.9-1.8-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.53-.54-.72-.55h-.61c-.21 0-.56.08-.86.4-.29.32-1.13 1.11-1.13 2.7 0 1.59 1.16 3.13 1.32 3.35.16.21 2.29 3.5 5.55 4.9.78.34 1.38.54 1.85.69.78.25 1.48.21 2.04.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.14-.29-.21-.61-.37Z" />
    </svg>
  );
}

export function InquiryForm({
  villaSlug,
  villaName,
}: {
  villaSlug?: string;
  villaName?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState<Guests>(DEFAULT_GUESTS);
  const selection = useUnitSelection(villaSlug ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InquiryInput>({
    resolver: zodResolver(InquirySchema),
    defaultValues: { villa: villaSlug ?? "" },
  });

  async function onSubmit(values: InquiryInput) {
    try {
      const payload = {
        ...values,
        checkIn: toISO(range?.from),
        checkOut: toISO(range?.to),
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        rooms: guests.rooms,
        guests: guests.adults + guests.children,
        bookingItems: selection ? [selection.item] : undefined,
      };
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Could not send");
      setSubmitted(true);
      reset();
      setRange(undefined);
      setGuests(DEFAULT_GUESTS);
      toast.success("Inquiry received — our concierge will be in touch.");
    } catch {
      toast.error(
        "Something went wrong. Please try again or email reservations@earthyrooms.com.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
        <h3 className="font-display text-2xl">Thank you.</h3>
        <p className="mt-2 text-muted-foreground">
          Your inquiry has reached us. A planner will be in touch within a few hours.
        </p>
      </div>
    );
  }

  const dateRangeText =
    range?.from && range?.to
      ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM")}`
      : "";

  const selectionText = selection
    ? ` (${selection.item.quantity}× ${selection.item.unitName}${
        selection.bedLabels?.length ? ` — ${selection.bedLabels.join(", ")}` : ""
      })`
    : "";
  const waText = encodeURIComponent(
    villaName
      ? `Hi Earthy Stays, I'd like to inquire about "${villaName}"${selectionText}${
          dateRangeText ? ` for ${dateRangeText}` : ""
        }.`
      : `Hi Earthy Stays, I'd like to inquire about a stay.`,
  );
  const waHref = `https://wa.me/${WHATSAPP_E164}?text=${waText}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {villaName && (
        <p className="text-xs text-muted-foreground">
          Inquiring about{" "}
          <span className="font-medium text-foreground">{villaName}</span>
        </p>
      )}

      {selection && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs">
          <p className="font-medium text-foreground">
            {selection.item.quantity}× {selection.item.unitName}
          </p>
          {selection.bedLabels && selection.bedLabels.length > 0 && (
            <p className="mt-0.5 text-muted-foreground">
              {selection.bedLabels.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Compact date + guests row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <DateRangePicker value={range} onChange={setRange} compactTrigger applyLabel="Apply Dates" />
        <GuestsPicker
          value={guests}
          onChange={setGuests}
          compactTrigger
          applyLabel="Apply"
          showFooterNote
          plainCounts
        />
      </div>

      {/* Name */}
      <div className="grid gap-1.5">
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            placeholder="Your name"
            aria-label="Your name"
            {...register("name")}
            autoComplete="name"
            className="h-12 rounded-md pl-11 text-[14px]"
          />
        </div>
        {errors.name?.message && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="grid gap-1.5">
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="Phone number"
            aria-label="Phone number"
            {...register("phone")}
            autoComplete="tel"
            className="h-12 rounded-md pl-11 text-[14px]"
          />
        </div>
        {errors.phone?.message && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <input type="hidden" {...register("villa")} />

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="mt-1 h-12 rounded-full text-sm font-semibold tracking-wide"
      >
        {isSubmitting ? "Sending…" : (
          <>
            Send Inquiry <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {/* or divider */}
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-border/70" />
        or
        <span className="h-px flex-1 bg-border/70" />
      </div>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-forest-green/70 px-5 text-sm font-semibold text-forest-green transition hover:bg-forest-green/5"
      >
        <WhatsAppGlyph className="h-4 w-4" />
        WhatsApp Inquiry
      </a>

      <p className="text-center text-xs text-muted-foreground">
        We typically reply within a few hours, every day of the week.
      </p>
    </form>
  );
}
