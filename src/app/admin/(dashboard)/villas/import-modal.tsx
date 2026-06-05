"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, AlertTriangle } from "lucide-react";
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
import { importListingAction } from "./import-action";

export function ImportListingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Paste a listing URL.");
      return;
    }
    const fd = new FormData();
    fd.set("url", url.trim());
    start(async () => {
      const res = await importListingAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Imported. Finish the missing fields below.");
      setOpen(false);
      setUrl("");
      router.push(`/admin/villas/${res.slug}/edit?imported=1`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          />
        }
      >
        <Download className="h-4 w-4" />
        Import from URL
      </DialogTrigger>

      <DialogContent className="!max-w-lg p-6">
        <DialogTitle className="font-display text-2xl font-bold tracking-tight">
          Import a listing
        </DialogTitle>
        <DialogDescription className="!text-sm text-muted-foreground">
          Paste an Airbnb / Booking.com / Vrbo / Agoda link and we&apos;ll create
          a stub villa with whatever we can read — name, hero photo, description,
          location.
        </DialogDescription>

        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="grid gap-1.5">
            <Label
              htmlFor="import-url"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Listing URL <span className="text-terracotta">*</span>
            </Label>
            <Input
              id="import-url"
              type="url"
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://www.booking.com/hotel/in/…"
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
            <p>
              <strong className="text-foreground">Heads up:</strong> Most
              platforms block automated scraping. You&apos;ll usually get the
              name, hero photo, and a short description — the rest (beds,
              price, amenities, full gallery) you fill in by hand on the next
              screen.
            </p>
            <p className="mt-1.5">
              Airbnb often returns very little. Booking.com works best.
            </p>
          </div>

          <div className="flex justify-end gap-2">
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
                  Importing…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1.5" />
                  Import
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
