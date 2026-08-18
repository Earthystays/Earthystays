"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
  Clipboard,
  Check,
  Sparkles,
} from "lucide-react";
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

type Source = {
  key: "booking" | "airbnb" | "vrbo" | "agoda" | "other";
  label: string;
  hostMatch: RegExp;
  reliability: "best" | "good" | "limited" | "unknown";
  note: string;
};

const SOURCES: Source[] = [
  {
    key: "booking",
    label: "Booking.com",
    hostMatch: /(^|\.)booking\.com$/i,
    reliability: "best",
    note: "Best results — name, photos, description, location and rating usually come through.",
  },
  {
    key: "vrbo",
    label: "Vrbo",
    hostMatch: /(^|\.)vrbo\.com$/i,
    reliability: "good",
    note: "Usually gets name, hero photo and description.",
  },
  {
    key: "agoda",
    label: "Agoda",
    hostMatch: /(^|\.)agoda\.com$/i,
    reliability: "good",
    note: "Usually gets name, hero photo and description.",
  },
  {
    key: "airbnb",
    label: "Airbnb",
    hostMatch: /(^|\.)airbnb\.(com|co\.[a-z]+|[a-z]{2,3})$/i,
    reliability: "limited",
    note: "Often returns very little — expect to fill most fields by hand.",
  },
];

function detectSource(url: string): Source | null {
  if (!url.trim()) return null;
  try {
    const host = new URL(url).hostname;
    return SOURCES.find((s) => s.hostMatch.test(host)) ?? {
      key: "other",
      label: host.replace(/^www\./, ""),
      hostMatch: /.*/,
      reliability: "unknown",
      note: "Not a platform we've tuned for — we'll try generic Open Graph tags.",
    };
  } catch {
    return null;
  }
}

const RELIABILITY_STYLES: Record<Source["reliability"], string> = {
  best: "bg-emerald-100 text-emerald-800 border-emerald-200",
  good: "bg-sky-100 text-sky-800 border-sky-200",
  limited: "bg-amber-100 text-amber-900 border-amber-200",
  unknown: "bg-muted text-muted-foreground border-border",
};

const RELIABILITY_LABEL: Record<Source["reliability"], string> = {
  best: "Best results",
  good: "Good",
  limited: "Limited",
  unknown: "Unknown",
};

export function ImportListingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState(false);

  const source = useMemo(() => detectSource(url), [url]);
  const urlLooksValid = source !== null;

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError(null);
        setPasted(true);
        setTimeout(() => setPasted(false), 1500);
      }
    } catch {
      setError("Couldn't read clipboard. Paste with ⌘V instead.");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = url.trim();
    if (!cleaned) {
      setError("Paste a listing URL.");
      return;
    }
    if (!urlLooksValid) {
      setError("That doesn't look like a valid URL. Include https:// at the start.");
      return;
    }
    const fd = new FormData();
    fd.set("url", cleaned);
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

      <DialogContent className="!max-w-xl p-0">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-display text-2xl font-bold tracking-tight">
                Import a listing
              </DialogTitle>
              <DialogDescription className="mt-1 !text-sm text-muted-foreground">
                Paste a link from a booking site. We'll pull what we can and open
                the edit form pre-filled — you finish the rest.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-5 px-6 py-5">
          <div className="grid gap-2">
            <Label
              htmlFor="import-url"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Listing URL
            </Label>
            <div className="relative flex items-stretch gap-2">
              <div className="relative flex-1">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  className="h-11 pl-10 pr-3"
                />
              </div>
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {pasted ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Pasted
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4" />
                    Paste
                  </>
                )}
              </button>
            </div>

            {source && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Detected:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {source.label}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                    RELIABILITY_STYLES[source.reliability]
                  }`}
                >
                  {RELIABILITY_LABEL[source.reliability]}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="grid gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              What we'll try to pull
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-foreground">
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Name
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Hero photo
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Description
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> City / state
              </li>
            </ul>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {source && source.reliability !== "unknown"
                ? source.note
                : "Beds, price, amenities and the full photo gallery you fill in by hand on the next screen. Most sites block automated scraping, so results vary — Booking.com works best."}
            </p>
          </div>

          <div className="-mx-6 -mb-5 flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
            <p className="text-[11px] text-muted-foreground">
              A stub villa is created — nothing is published until you save.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending || !url.trim()}
                className="rounded-md"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Import listing
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
