/**
 * MigrationReport — the structured result of a Phase B import (dry-run or
 * executed). Pure data; no IO. Rendered to the console by the runner.
 */

export type ReviewItem = {
  entity: string;
  id: string;
  reason: string;
};

export type EntityStats = {
  found: number;
  valid: number;
  imported: number; // 0 in dry-run
  skipped: number;
};

export function emptyStats(): EntityStats {
  return { found: 0, valid: 0, imported: 0, skipped: 0 };
}

export type MigrationReport = {
  mode: "dry-run" | "execute";
  startedAt: string;
  entities: {
    users: EntityStats;
    properties: EntityStats;
    experiences: EntityStats;
    inquiries: EntityStats;
    paymentAccounts: EntityStats;
  };
  duplicateIds: ReviewItem[];
  invalidRecords: ReviewItem[];
  missingRelationships: ReviewItem[];
  needsManualReview: ReviewItem[];
  warnings: ReviewItem[];
  /** Guardrail: must always be empty in Phase B. */
  financialRecordsCreated: ReviewItem[];
};

export function emptyReport(mode: MigrationReport["mode"]): MigrationReport {
  return {
    mode,
    startedAt: new Date().toISOString(),
    entities: {
      users: emptyStats(),
      properties: emptyStats(),
      experiences: emptyStats(),
      inquiries: emptyStats(),
      paymentAccounts: emptyStats(),
    },
    duplicateIds: [],
    invalidRecords: [],
    missingRelationships: [],
    needsManualReview: [],
    warnings: [],
    financialRecordsCreated: [],
  };
}
