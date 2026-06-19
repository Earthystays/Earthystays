"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ExperienceSchema = z.object({
  name: z.string().min(2, "Please share your name"),
  phone: z.string().min(7, "Please share a reachable WhatsApp number"),
  email: z.string().email().optional().or(z.literal("")),
  checkIn: z.string().optional(),
  villa: z.string().optional(),
  experience: z.string().min(1),
  message: z.string().optional(),
});

export type ExperienceInquiryInput = z.infer<typeof ExperienceSchema>;

export function ExperienceInquiryForm({
  experienceSlug,
  experienceName,
}: {
  experienceSlug: string;
  experienceName: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExperienceInquiryInput>({
    resolver: zodResolver(ExperienceSchema),
    defaultValues: { experience: experienceSlug },
  });

  async function onSubmit(values: ExperienceInquiryInput) {
    try {
      const payload = {
        kind: "experience",
        name: values.name,
        phone: values.phone,
        email: values.email,
        checkIn: values.checkIn,
        villa: values.villa,
        message: [
          `Experience: ${experienceName} (${experienceSlug})`,
          values.message?.trim() ? `Notes: ${values.message.trim()}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      };
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Could not send");
      setSubmitted(true);
      reset();
      toast.success("Inquiry received — our concierge will be in touch.");
    } catch {
      toast.error(
        "Something went wrong. Try again or email reservations@earthyrooms.com.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
        <h3 className="font-display text-2xl">Thank you.</h3>
        <p className="mt-2 text-muted-foreground">
          Your inquiry has reached our concierge — we&apos;ll come back within
          a few hours with a tailored quote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...register("experience")} />

      <Field id="exp-name" label="Full Name *" error={errors.name?.message}>
        <Input id="exp-name" {...register("name")} autoComplete="name" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="exp-phone"
          label="WhatsApp Number *"
          error={errors.phone?.message}
        >
          <Input
            id="exp-phone"
            type="tel"
            inputMode="tel"
            {...register("phone")}
            autoComplete="tel"
          />
        </Field>
        <Field id="exp-email" label="Email" error={errors.email?.message}>
          <Input
            id="exp-email"
            type="email"
            {...register("email")}
            autoComplete="email"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="exp-checkin" label="Check-In Date">
          <Input id="exp-checkin" type="date" {...register("checkIn")} />
        </Field>
        <Field id="exp-villa" label="Property Staying At">
          <Input
            id="exp-villa"
            placeholder="Villa name (optional)"
            {...register("villa")}
          />
        </Field>
      </div>

      <Field id="exp-message" label="Additional Requirements">
        <Textarea
          id="exp-message"
          rows={4}
          {...register("message")}
          placeholder="Group size, occasion, anything we should know…"
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="mt-2 rounded-full"
      >
        {isSubmitting ? "Sending…" : "Get a Personalized Quote"}
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
      <Label
        htmlFor={id}
        className="text-xs uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
