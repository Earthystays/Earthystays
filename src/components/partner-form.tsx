"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971", "+65", "+81", "+33", "+49"];

const LOCATIONS = [
  "Goa",
  "Lonavala",
  "Karjat",
  "Alibaug",
  "Udaipur",
  "Jaipur",
  "Coorg",
  "Manali",
  "Shimla",
  "Mussoorie",
  "Wayanad",
  "Other",
];

const PROPERTY_TYPES = [
  "Villa",
  "Apartment",
  "Bungalow",
  "Farmhouse",
  "Cottage",
  "Tent / Glamping",
  "Other",
];

const ROOM_COUNTS = ["1", "2", "3", "4", "5", "6", "7", "8+"];

const REFERRAL_SOURCES = [
  "Google search",
  "Instagram",
  "Friend / family",
  "Newspaper / magazine",
  "Booking.com / Airbnb",
  "Other",
];

const Schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Use a valid email"),
  countryCode: z.string(),
  phone: z.string().min(7, "Use a valid phone"),
  location: z.string().min(1, "Pick a location"),
  propertyType: z.string().min(1, "Pick a type"),
  rooms: z.string().optional(),
  referral: z.string().min(1, "Where did you hear about us?"),
  link: z.string().optional(),
  description: z.string().optional(),
});

type Input = z.infer<typeof Schema>;

export function PartnerForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Input>({
    resolver: zodResolver(Schema),
    defaultValues: { countryCode: "+91" },
  });

  async function onSubmit(values: Input) {
    try {
      const fullPhone = `${values.countryCode} ${values.phone}`.trim();
      const noteLines = [
        values.rooms ? `Rooms: ${values.rooms}` : null,
        values.referral ? `Heard via: ${values.referral}` : null,
        values.link ? `Photos / link: ${values.link}` : null,
        values.description ? `\n${values.description}` : null,
      ].filter(Boolean);
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "partner",
          name: `${values.firstName} ${values.lastName}`.trim(),
          phone: fullPhone,
          email: values.email,
          city: values.location,
          propertyType: values.propertyType,
          rooms: values.rooms ? Number(values.rooms.replace("+", "")) : undefined,
          message: noteLines.join("\n"),
        }),
      });
      if (!res.ok) throw new Error("Could not send");
      setSubmitted(true);
      reset();
      toast.success("Got it — our partnerships team will be in touch.");
    } catch {
      toast.error(
        "Something went wrong. Please try again or email reservations@earthyrooms.com.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center shadow-2xl">
        <p className="text-3xl">🎉</p>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">
          Thank you!
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Our partnerships team will reach out within a working day to talk through
          the next steps.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl bg-card p-6 shadow-2xl sm:p-7"
    >
      <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Tell us more about your house
      </h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* First Name */}
        <Field label="First Name" required error={errors.firstName?.message}>
          <Input {...register("firstName")} autoComplete="given-name" />
        </Field>

        {/* Last Name */}
        <Field label="Last Name" required error={errors.lastName?.message}>
          <Input {...register("lastName")} autoComplete="family-name" />
        </Field>

        {/* Email */}
        <Field label="Email ID" required error={errors.email?.message}>
          <Input type="email" {...register("email")} autoComplete="email" />
        </Field>

        {/* Phone with country code prefix */}
        <Field label="Mobile phone" required error={errors.phone?.message}>
          <div className="flex gap-2">
            <select
              {...register("countryCode")}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Input
              type="tel"
              inputMode="tel"
              {...register("phone")}
              className="flex-1"
              autoComplete="tel-national"
            />
          </div>
        </Field>

        {/* Property location */}
        <Field label="Select your property location" required error={errors.location?.message}>
          <Select {...register("location")} placeholder="Choose…">
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>

        {/* Property type */}
        <Field
          label="What type of property is it?"
          required
          error={errors.propertyType?.message}
        >
          <Select {...register("propertyType")} placeholder="Choose…">
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        {/* Rooms */}
        <Field label="How many rooms?">
          <Select {...register("rooms")} placeholder="Choose…">
            {ROOM_COUNTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>

        {/* Referral */}
        <Field label="Where did you hear about us?" required error={errors.referral?.message}>
          <Select {...register("referral")} placeholder="Choose…">
            {REFERRAL_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Full-width: photos link */}
      <div className="mt-3">
        <Field label="Photos/Website link (if any)">
          <Input
            {...register("link")}
            placeholder="Drive folder, website, Instagram handle…"
          />
        </Field>
      </div>

      {/* Full-width: description */}
      <div className="mt-3">
        <Field label="Describe your property">
          <Textarea
            {...register("description")}
            rows={3}
            placeholder="A few lines about your home, its location, what guests love about it…"
          />
        </Field>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 h-12 w-full justify-center rounded-md bg-foreground text-base font-semibold text-background hover:bg-foreground/90"
      >
        {isSubmitting ? "Sending…" : "Send a request"}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      {children}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

// Lightweight select that matches the Input styling — single border, brand-aware.
function Select({
  placeholder,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  return (
    <select
      {...props}
      defaultValue=""
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}
