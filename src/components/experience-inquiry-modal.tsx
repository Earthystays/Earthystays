"use client";

import { useEffect, useState, useTransition } from "react";
import { Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Experience } from "@/lib/types";

/**
 * Lightweight inquiry modal for the Experiences section. Three fields —
 * name, phone, experience dropdown — that POST to /api/inquiries with
 * kind="experience". Used in place of per-experience detail pages while
 * those are being designed.
 */
export function ExperienceInquiryModal({
  experiences,
  open,
  onOpenChange,
  initialSlug,
}: {
  experiences: Experience[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSlug?: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState<string>(initialSlug ?? experiences[0]?.slug ?? "");
  const [pending, start] = useTransition();

  // When the parent opens the modal with a different experience (e.g. user
  // clicks a different card without closing in between), re-pin the
  // dropdown to that experience.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync dropdown to externally-controlled prop when modal re-opens
    if (open && initialSlug) setSlug(initialSlug);
  }, [open, initialSlug]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }
    const chosen = experiences.find((x) => x.slug === slug);
    if (!chosen) {
      toast.error("Please choose an experience");
      return;
    }
    start(async () => {
      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: "experience",
            name: name.trim(),
            phone: phone.trim(),
            message: `Experience: ${chosen.name} (${chosen.slug})`,
          }),
        });
        if (!res.ok) {
          toast.error("Could not send. Try again or call us directly.");
          return;
        }
        toast.success("Thanks! Our concierge will be in touch shortly.");
        setName("");
        setPhone("");
        onOpenChange(false);
      } catch {
        toast.error("Network error. Try again in a moment.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-md p-7">
        <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
          Plan your experience
        </DialogTitle>
        <DialogDescription className="!text-sm text-muted-foreground">
          Share a few details and our concierge will WhatsApp you with options
          — usually within a few hours.
        </DialogDescription>

        <form onSubmit={submit} className="mt-4 grid gap-3.5">
          <div className="grid gap-1.5">
            <Label
              htmlFor="exp-name"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Full name <span className="text-terracotta">*</span>
            </Label>
            <Input
              id="exp-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="exp-phone"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Phone / WhatsApp <span className="text-terracotta">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm text-foreground">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                +91
              </span>
              <Input
                id="exp-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 font-numeric tabular-nums"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="exp-slug"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Experience <span className="text-terracotta">*</span>
            </Label>
            <div className="relative">
              <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="exp-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-11 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              >
                {experiences.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 rounded-md text-sm font-semibold uppercase tracking-[0.12em]"
          >
            {pending ? "Sending…" : "Get a Personalised Quote"}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            We&apos;ll never spam — only a concierge reaching out about this
            experience.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
