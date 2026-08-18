import { useSyncExternalStore } from "react";
import type { BookingItem } from "@/lib/types";

/**
 * Cross-tree selection bridge (Phase G).
 *
 * The room/dorm cards live in the page's "Rooms" section while the inquiry
 * form lives in the sticky aside — different React subtrees under one server
 * page. This module-level store lets a guest's room/bed pick flow into the
 * inquiry form without restructuring the page's server/client boundary.
 *
 * Client-only in practice (imported by client components); holds no server
 * state and touches no storage.
 */

export type UnitSelection = {
  /** Property slug the selection belongs to (guards against stale carry-over). */
  slug: string;
  item: BookingItem;
  /** Human-readable labels of chosen beds, for the summary line. */
  bedLabels?: string[];
};

let current: UnitSelection | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setUnitSelection(sel: UnitSelection | null) {
  current = sel;
  emit();
}

export function clearUnitSelection() {
  setUnitSelection(null);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return current;
}

/** Read the current selection, scoped to `slug` (ignores selections made on
 *  a different listing that lingered in the singleton). */
export function useUnitSelection(slug: string): UnitSelection | null {
  const sel = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null, // server snapshot — no selection during SSR
  );
  return sel && sel.slug === slug ? sel : null;
}
