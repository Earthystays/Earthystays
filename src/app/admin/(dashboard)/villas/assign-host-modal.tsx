"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, UserPlus, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignHostAction, removeHostAction } from "./host-actions";

export function AssignHostButton({
  slug,
  villaName,
  host,
}: {
  slug: string;
  villaName: string;
  /** Currently assigned host, if any. */
  host?: { name: string; email: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await assignHostAction(slug, email);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`${villaName} is now managed by ${res.hostName}.`);
      setOpen(false);
      setEmail("");
      router.refresh();
    });
  }

  function removeHost() {
    if (!host) return;
    if (!confirm(`Remove ${host.name}'s access to "${villaName}"? The listing stays live, managed by the team.`)) return;
    start(async () => {
      const res = await removeHostAction(slug);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`${villaName} is back to team-managed.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
      <DialogTrigger
        render={
          <button
            type="button"
            title={host ? `Managed by ${host.name}` : "Assign a host"}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          />
        }
      >
        {host ? <UserRound className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        {host ? "Host" : "Assign"}
      </DialogTrigger>

      <DialogContent className="!max-w-md p-6">
        <DialogTitle className="font-display text-2xl font-bold tracking-tight">
          {host ? "Listing host" : "Assign a host"}
        </DialogTitle>
        <DialogDescription className="!text-sm text-muted-foreground">
          {host ? (
            <>
              <span className="font-medium text-foreground">{villaName}</span> is managed by{" "}
              <span className="font-medium text-foreground">{host.name}</span> ({host.email}).
              You can hand it to someone else or take it back in-house.
            </>
          ) : (
            <>
              Give a host access to{" "}
              <span className="font-medium text-foreground">{villaName}</span>. They&apos;ll
              manage it from their host dashboard — enter the email of their Earthy Stays
              account and we&apos;ll notify them.
            </>
          )}
        </DialogDescription>

        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="grid gap-1.5">
            <Label
              htmlFor={`host-email-${slug}`}
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              {host ? "Reassign to (email)" : "Host email"} <span className="text-terracotta">*</span>
            </Label>
            <Input
              id={`host-email-${slug}`}
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="host@example.com"
              className="h-11"
            />
          </div>

          {error && (
            <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="rounded-md bg-muted/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            The email must belong to an existing Earthy Stays account. The host gets an
            email with a link to their dashboard, where this listing, its bookings, and
            guest messages will appear.
          </div>

          <div className="flex items-center justify-between gap-2">
            {host ? (
              <Button
                type="button"
                variant="ghost"
                onClick={removeHost}
                disabled={pending}
                className="rounded-md text-destructive hover:text-destructive"
              >
                Remove access
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-md"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="rounded-md">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    {host ? "Reassign" : "Assign host"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
