/**
 * Human-readable rendering of a MigrationReport. Pure string builder.
 */
import type { MigrationReport, ReviewItem } from "./report";

function section(title: string, items: ReviewItem[]): string {
  if (items.length === 0) return `\n${title}: none`;
  const lines = items.map((i) => `  • [${i.entity}] ${i.id} — ${i.reason}`);
  return `\n${title} (${items.length}):\n${lines.join("\n")}`;
}

export function renderReport(r: MigrationReport): string {
  const e = r.entities;
  const row = (label: string, s: { found: number; valid: number; imported: number; skipped: number }) =>
    `  ${label.padEnd(18)} found=${s.found}  valid=${s.valid}  imported=${s.imported}  skipped=${s.skipped}`;

  return [
    "════════════════════════════════════════════════════════════",
    ` EARTHY STAYS — Phase B migration report  [${r.mode.toUpperCase()}]`,
    ` ${r.startedAt}`,
    "════════════════════════════════════════════════════════════",
    "Counts:",
    row("users", e.users),
    row("properties", e.properties),
    row("experiences", e.experiences),
    row("inquiries", e.inquiries),
    row("paymentAccounts", e.paymentAccounts),
    section("Duplicate IDs", r.duplicateIds),
    section("Invalid records", r.invalidRecords),
    section("Missing relationships", r.missingRelationships),
    section("Needs manual review", r.needsManualReview),
    section("Warnings", r.warnings),
    section("Financial records created (MUST be none)", r.financialRecordsCreated),
    "════════════════════════════════════════════════════════════",
  ].join("\n");
}
