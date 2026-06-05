"use client";

import { useState, useTransition } from "react";
import { Headset, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * "Request Callback" CTA + modal. A short two-field form (name + phone)
 * for guests who want a planner to ring them back — POSTs to the same
 * /api/inquiries endpoint as every other lead, with kind="callback".
 */
export function CallbackModal({
  triggerClassName,
  triggerLabel = "Request Callback",
  showIcon = true,
  open: controlledOpen,
  onOpenChange,
}: {
  triggerClassName?: string;
  triggerLabel?: string;
  /** Set to false when the trigger lives in a plain text list (e.g. footer). */
  showIcon?: boolean;
  /** Controlled-mode props: when provided, the built-in trigger is hidden
   *  and a parent opens/closes the modal (used by dropdown menu items,
   *  mobile drawers, etc. where the trigger lives elsewhere). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? (onOpenChange ?? (() => {}))
    : setUncontrolledOpen;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (name.length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }
    start(async () => {
      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "callback", name, phone: phone.trim() }),
        });
        if (!res.ok) {
          toast.error("Could not send. Try again or call us directly.");
          return;
        }
        toast.success("Thanks! Our team will call you shortly.");
        setFirstName("");
        setLastName("");
        setPhone("");
        setOpen(false);
      } catch {
        toast.error("Network error. Try again in a moment.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* In controlled mode the parent renders its own trigger and we hide
          the built-in one. */}
      {!isControlled && (
        <DialogTrigger
          render={
            <button
              type="button"
              className={
                triggerClassName ??
                "inline-flex items-center gap-1.5 font-medium text-terracotta hover:underline"
              }
            />
          }
        >
          {showIcon && <Headset className="h-4 w-4" />}
          {triggerLabel}
        </DialogTrigger>
      )}

      <DialogContent className="!max-w-md p-7">
        <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
          Looking for a perfect stay?
        </DialogTitle>
        <DialogDescription className="!text-sm text-muted-foreground">
          Drop your name and number — our planner will call you back shortly.
        </DialogDescription>

        <form onSubmit={submit} className="mt-4 grid gap-3.5">
          <div className="grid gap-1.5">
            <Label
              htmlFor="cb-first"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              First name <span className="text-terracotta">*</span>
            </Label>
            <Input
              id="cb-first"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Aanya"
              className="h-11"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="cb-last"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Last name <span className="text-terracotta">*</span>
            </Label>
            <Input
              id="cb-last"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mehta"
              className="h-11"
            />
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="cb-phone"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Phone number <span className="text-terracotta">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm text-foreground">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                +91
              </span>
              <Input
                id="cb-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="h-11 font-numeric tabular-nums"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 rounded-md text-sm font-semibold uppercase tracking-[0.12em]"
          >
            {pending ? "Sending…" : "Submit"}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            We&apos;ll never spam — only one call from a real planner.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
