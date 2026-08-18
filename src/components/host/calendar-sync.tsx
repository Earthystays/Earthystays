"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type { IcalImport } from "@/lib/data/ical";
import {
  addCalendarImport,
  removeCalendarImport,
  syncCalendarsNow,
} from "@/app/host/(dash)/calendar/sync-actions";

function fmtWhen(iso?: string): string {
  if (!iso) return "never";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function CalendarSync({
  slug,
  exportUrl,
  imports: initialImports,
}: {
  slug: string;
  exportUrl: string;
  imports: IcalImport[];
}) {
  const router = useRouter();
  const [imports, setImports] = useState(initialImports);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, startBusy] = useTransition();

  function copyExport() {
    navigator.clipboard?.writeText(exportUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function add() {
    setError(null);
    startBusy(async () => {
      const res = await addCalendarImport(slug, name, url);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      if (res.config) setImports(res.config.imports);
      setName("");
      setUrl("");
      setAdding(false);
      router.refresh();
    });
  }

  function remove(importId: string) {
    setError(null);
    startBusy(async () => {
      const res = await removeCalendarImport(slug, importId);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      setImports((prev) => prev.filter((i) => i.id !== importId));
      router.refresh();
    });
  }

  function syncNow() {
    setError(null);
    startBusy(async () => {
      const res = await syncCalendarsNow(slug);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      if (res.config) setImports(res.config.imports);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Calendar sync</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Keep availability aligned with Airbnb, Booking.com and other platforms via iCal.
          </p>
        </div>
        {imports.length > 0 && (
          <button
            type="button"
            onClick={syncNow}
            disabled={busy}
            className="flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium hover:bg-muted/50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync now
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* export */}
        <div className="rounded-xl border border-border/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            Export to other platforms
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Paste this link into the other platform&apos;s <em>Import calendar</em> option —
            it shares only busy dates, never guest details. Platforms refresh it every few hours.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              value={exportUrl}
              onFocus={(e) => e.target.select()}
              className="h-9 min-w-0 flex-1 truncate rounded-lg border border-border bg-muted/30 px-3 text-xs text-muted-foreground"
            />
            <button
              type="button"
              onClick={copyExport}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-medium hover:bg-muted/50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* imports */}
        <div className="rounded-xl border border-border/60 p-4">
          <p className="text-sm font-semibold">Import from other platforms</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Paste the iCal export link from Airbnb or Booking.com — their bookings show on
            this calendar so you never double-book.
          </p>

          {imports.length > 0 && (
            <ul className="mt-3 space-y-2">
              {imports.map((imp) => (
                <li key={imp.id} className="flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{imp.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {imp.lastStatus === "error" ? (
                        <>
                          <TriangleAlert className="h-3 w-3 text-amber-600" />
                          <span className="text-amber-700">{imp.lastError ?? "Sync failed"}</span>
                        </>
                      ) : (
                        <>Synced {fmtWhen(imp.lastSyncedAt)} · {imp.eventCount ?? 0} busy period{(imp.eventCount ?? 0) === 1 ? "" : "s"}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(imp.id)}
                    disabled={busy}
                    aria-label={`Remove ${imp.name} calendar`}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <div className="mt-3 grid gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Platform name, e.g. Airbnb"
                className="h-9 rounded-lg border border-border bg-background px-3 text-[13.5px]"
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… .ics link from that platform"
                className="h-9 rounded-lg border border-border bg-background px-3 text-[13.5px]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={add}
                  disabled={busy || !name.trim() || !url.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Connect
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setError(null); }}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add a calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
