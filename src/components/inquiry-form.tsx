"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker, type DateRange } from "@/components/date-range-picker";
import { GuestsPicker, DEFAULT_GUESTS, type Guests } from "@/components/guests-picker";

const InquirySchema = z.object({
  name: z.string().min(2, "Please share your name"),
  phone: z.string().min(7, "Please share a reachable phone number"),
  villa: z.string().optional(),
});

export type InquiryInput = z.infer<typeof InquirySchema>;

function toISO(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {villaName && (
        <p className="text-sm text-muted-foreground">
          Inquiring about{" "}
          <span className="font-medium text-foreground">{villaName}</span>
        </p>
      )}

      <Field id="name" label="Your Name *" error={errors.name?.message}>
        <Input id="name" {...register("name")} autoComplete="name" />
      </Field>

      <Field id="phone" label="Phone *" error={errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          {...register("phone")}
          autoComplete="tel"
        />
      </Field>

      {/* Dates — full calendar popover */}
      <div className="grid gap-1.5">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Dates</span>
        <div className="rounded-md border border-border bg-background">
          <DateRangePicker value={range} onChange={setRange} />
        </div>
      </div>

      {/* Guests — Adults / Children / Infants / Rooms popover */}
      <div className="grid gap-1.5">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Guests</span>
        <div className="rounded-md border border-border bg-background">
          <GuestsPicker value={guests} onChange={setGuests} />
        </div>
      </div>

      <input type="hidden" {...register("villa")} />

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="mt-2 rounded-full"
      >
        {isSubmitting ? "Sending…" : "Send inquiry"}
      </Button>
      <p className="text-xs text-muted-foreground">
        We typically reply within a few hours, every day of the week.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
