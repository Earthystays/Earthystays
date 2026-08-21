/**
 * Lightweight audit-event sink for the booking lifecycle. Phase 1B.5 Phase C.
 *
 * The full immutable AuditLog TABLE arrives in Phase L. This injectable sink
 * lets the booking service emit structured audit events now (booking created /
 * confirmed / cancelled, hold created / expired / released / converted) without
 * prematurely building that table. Tests inject a capturing sink; the default
 * logs to the console.
 */
export type BookingAuditAction =
  | "booking.created"
  | "booking.confirmed"
  | "booking.cancelled"
  | "booking.expired"
  | "hold.created"
  | "hold.expired"
  | "hold.released"
  | "hold.converted";

export type AuditEvent = {
  action: BookingAuditAction;
  entity: "booking" | "inventory_hold";
  entityId: string;
  actorKind: "guest" | "host" | "admin" | "system";
  actorId?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  at: string; // ISO
};

export interface AuditSink {
  emit(event: AuditEvent): void | Promise<void>;
}

export const consoleAuditSink: AuditSink = {
  emit(event) {
    // eslint-disable-next-line no-console
    console.log(`[audit] ${event.action} ${event.entity}:${event.entityId}`, event.metadata ?? "");
  },
};

/** Captures events in memory — for tests. */
export class MemoryAuditSink implements AuditSink {
  events: AuditEvent[] = [];
  emit(event: AuditEvent) {
    this.events.push(event);
  }
  actions() {
    return this.events.map((e) => e.action);
  }
}
