import { randomBytes } from "crypto";
import { readJson, writeJson } from "@/lib/storage";

/**
 * iCal calendar sync (OTA interop, v1).
 *
 * Export — every listing gets a tokened .ics feed of confirmed stays and
 * blocked nights, which the host pastes into Airbnb / Booking.com / Vrbo
 * ("Import calendar" on those platforms).
 *
 * Import — the host pastes the OTA's .ics URL here; we fetch it and show
 * its busy ranges on the host calendar so double-bookings are visible.
 * OTAs refresh iCal feeds every few hours themselves, so parity there.
 */

export type IcalImport = {
  id: string;
  /** Host-facing label, e.g. "Airbnb". */
  name: string;
  url: string;
  lastSyncedAt?: string;
  lastStatus?: "ok" | "error";
  lastError?: string;
  eventCount?: number;
};

export type IcalConfig = {
  /** Secret for the export feed URL — regenerable. */
  token: string;
  imports: IcalImport[];
};

export type BusyRange = {
  /** YYYY-MM-DD inclusive start (first busy night). */
  start: string;
  /** YYYY-MM-DD exclusive end (checkout day), iCal DTEND convention. */
  end: string;
  summary?: string;
};

type ConfigStore = Record<string, IcalConfig>;
type EventStore = Record<string, Record<string, BusyRange[]>>; // slug → importId → ranges

const CONFIG_FILE = "ical-sync.json";
const EVENTS_FILE = "ical-events.json";

/* Serialize read-modify-write cycles (same pattern as messages.ts). */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export async function getIcalConfig(slug: string): Promise<IcalConfig> {
  const store = await readJson<ConfigStore>(CONFIG_FILE, {});
  return store[slug] ?? { token: "", imports: [] };
}

/** Config with a token, creating one on first use. */
export async function ensureIcalConfig(slug: string): Promise<IcalConfig> {
  return withLock(async () => {
    const store = await readJson<ConfigStore>(CONFIG_FILE, {});
    if (!store[slug] || !store[slug].token) {
      store[slug] = { token: randomBytes(16).toString("hex"), imports: store[slug]?.imports ?? [] };
      await writeJson(CONFIG_FILE, store);
    }
    return store[slug];
  });
}

export async function addIcalImport(
  slug: string,
  name: string,
  url: string,
): Promise<IcalImport> {
  return withLock(async () => {
    const store = await readJson<ConfigStore>(CONFIG_FILE, {});
    const cfg = store[slug] ?? { token: randomBytes(16).toString("hex"), imports: [] };
    const imp: IcalImport = {
      id: `ical_${Date.now()}_${randomBytes(3).toString("hex")}`,
      name: name.trim(),
      url: url.trim(),
    };
    cfg.imports.push(imp);
    store[slug] = cfg;
    await writeJson(CONFIG_FILE, store);
    return imp;
  });
}

export async function removeIcalImport(slug: string, importId: string): Promise<void> {
  return withLock(async () => {
    const store = await readJson<ConfigStore>(CONFIG_FILE, {});
    const cfg = store[slug];
    if (!cfg) return;
    cfg.imports = cfg.imports.filter((i) => i.id !== importId);
    await writeJson(CONFIG_FILE, store);

    const events = await readJson<EventStore>(EVENTS_FILE, {});
    if (events[slug]) {
      delete events[slug][importId];
      await writeJson(EVENTS_FILE, events);
    }
  });
}

export async function getImportedBusyRanges(
  slug: string,
): Promise<Array<BusyRange & { sourceName: string }>> {
  const [cfg, events] = await Promise.all([
    getIcalConfig(slug),
    readJson<EventStore>(EVENTS_FILE, {}),
  ]);
  const bySource = events[slug] ?? {};
  const out: Array<BusyRange & { sourceName: string }> = [];
  for (const imp of cfg.imports) {
    for (const r of bySource[imp.id] ?? []) {
      out.push({ ...r, sourceName: imp.name });
    }
  }
  return out;
}

/* ── iCal parsing ───────────────────────────────────────────── */

/** Unfold RFC 5545 folded lines (continuation lines start with WSP). */
function unfold(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** "20260717" or "20260717T140000Z" → "2026-07-17"; null if unparseable. */
function icalDateToDay(value: string): string | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseIcalBusyRanges(icsText: string): BusyRange[] {
  const ranges: BusyRange[] = [];
  let inEvent = false;
  let start: string | null = null;
  let end: string | null = null;
  let summary: string | undefined;

  for (const line of unfold(icsText)) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      start = end = null;
      summary = undefined;
    } else if (line.startsWith("END:VEVENT")) {
      if (inEvent && start) {
        if (!end) {
          // No DTEND — treat as a single night.
          const d = new Date(`${start}T00:00:00`);
          d.setDate(d.getDate() + 1);
          end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
        if (end > start) ranges.push({ start, end, summary });
      }
      inEvent = false;
    } else if (inEvent) {
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const prop = line.slice(0, idx).split(";")[0].toUpperCase();
      const value = line.slice(idx + 1).trim();
      if (prop === "DTSTART") start = icalDateToDay(value);
      else if (prop === "DTEND") end = icalDateToDay(value);
      else if (prop === "SUMMARY") summary = value.slice(0, 80);
    }
  }
  return ranges;
}

/* ── sync ───────────────────────────────────────────────────── */

/** Only fetch plausible public calendar URLs — never internal hosts. */
export function isSafeIcalUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return false;
    }
  }
  if (h === "::1" || h.startsWith("[")) return false;
  return true;
}

const SYNC_STALE_MS = 6 * 60 * 60 * 1000; // match OTA refresh cadence (~hours)

export function isSyncStale(cfg: IcalConfig): boolean {
  return cfg.imports.some(
    (i) => !i.lastSyncedAt || Date.now() - new Date(i.lastSyncedAt).getTime() > SYNC_STALE_MS,
  );
}

/** Fetch every import feed for a listing and store its busy ranges. */
export async function syncIcalImports(slug: string): Promise<IcalConfig> {
  const cfg = await getIcalConfig(slug);
  if (cfg.imports.length === 0) return cfg;

  const results = await Promise.all(
    cfg.imports.map(async (imp) => {
      if (!isSafeIcalUrl(imp.url)) {
        return { imp, ok: false as const, error: "URL must be a public https link" };
      }
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10_000);
        const res = await fetch(imp.url, {
          signal: ctrl.signal,
          headers: { accept: "text/calendar, text/plain, */*" },
          redirect: "follow",
          cache: "no-store",
        });
        clearTimeout(timer);
        if (!res.ok) return { imp, ok: false as const, error: `Feed returned ${res.status}` };
        const text = await res.text();
        if (!text.includes("BEGIN:VCALENDAR")) {
          return { imp, ok: false as const, error: "Not an iCal feed" };
        }
        return { imp, ok: true as const, ranges: parseIcalBusyRanges(text) };
      } catch {
        return { imp, ok: false as const, error: "Couldn't reach the feed" };
      }
    }),
  );

  return withLock(async () => {
    const store = await readJson<ConfigStore>(CONFIG_FILE, {});
    const events = await readJson<EventStore>(EVENTS_FILE, {});
    const current = store[slug] ?? cfg;
    events[slug] = events[slug] ?? {};
    const now = new Date().toISOString();

    for (const r of results) {
      const target = current.imports.find((i) => i.id === r.imp.id);
      if (!target) continue; // removed mid-sync
      target.lastSyncedAt = now;
      if (r.ok) {
        target.lastStatus = "ok";
        target.lastError = undefined;
        target.eventCount = r.ranges.length;
        events[slug][r.imp.id] = r.ranges;
      } else {
        target.lastStatus = "error";
        target.lastError = r.error;
      }
    }

    store[slug] = current;
    await writeJson(CONFIG_FILE, store);
    await writeJson(EVENTS_FILE, events);
    return current;
  });
}

/* ── export feed ────────────────────────────────────────────── */

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function dayToIcs(day: string): string {
  return day.replace(/-/g, "");
}

/** Merge sorted YYYY-MM-DD nights into [start, endExclusive) ranges. */
export function mergeNightsToRanges(nights: string[]): Array<{ start: string; end: string }> {
  const sorted = [...new Set(nights)].sort();
  const out: Array<{ start: string; end: string }> = [];
  for (const night of sorted) {
    const d = new Date(`${night}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const last = out[out.length - 1];
    if (last && last.end === night) last.end = next;
    else out.push({ start: night, end: next });
  }
  return out;
}

export function buildIcalFeed(
  listingName: string,
  entries: Array<{ uid: string; start: string; end: string; summary: string }>,
): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Earthy Stays//Host Calendar 1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(listingName)} — Earthy Stays`,
  ];
  for (const e of entries) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@earthystays.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dayToIcs(e.start)}`,
      `DTEND;VALUE=DATE:${dayToIcs(e.end)}`,
      `SUMMARY:${icsEscape(e.summary)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
