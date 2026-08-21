/**
 * Phase B migration runner: JSON → PostgreSQL.
 *
 *   npm run db:import            # dry-run (default): validates + prints report, writes NOTHING
 *   npm run db:import -- --execute   # requires DATABASE_URL; upserts idempotently
 *
 * Properties:
 *   • Non-destructive — never deletes or edits the source JSON.
 *   • Idempotent — upserts on primary key / unique key, so re-running produces
 *     no duplicates.
 *   • Validation-heavy — a full MigrationReport is printed either way.
 *   • Safe by default — writes ONLY when --execute is passed.
 *
 * NO financial records (payments/refunds/payouts/ledger/bookings) are ever
 * created here (spec §11).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { renderReport } from "./render";
import { transformAll } from "./transform";

const DATA_DIR = join(process.cwd(), "data");

function readJson(file: string): Record<string, unknown>[] {
  try {
    const raw = readFileSync(join(DATA_DIR, file), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  const execute = process.argv.includes("--execute");
  const mode = execute ? "execute" : "dry-run";

  const out = transformAll({
    users: readJson("users.json"),
    villas: readJson("villas.json"),
    experiences: readJson("experiences.json"),
    inquiries: readJson("inquiries.json"),
    mode,
  });

  if (!execute) {
    out.report.entities.users.imported = 0;
    out.report.entities.properties.imported = 0;
    out.report.entities.experiences.imported = 0;
    out.report.entities.inquiries.imported = 0;
    out.report.entities.paymentAccounts.imported = 0;
    console.log(renderReport(out.report));
    console.log(
      "\nDRY RUN — no data written. Re-run with `-- --execute` (and DATABASE_URL set) to import.",
    );
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error(
      "ERROR: --execute requires DATABASE_URL to point at a running PostgreSQL instance.",
    );
    process.exit(1);
  }

  // Dynamic import so a dry-run never even loads the DB driver.
  const { getDb, closeDb } = await import("../client");
  const schema = await import("../schema");
  const db = getDb();

  // Order respects FKs: users → payment_accounts → properties/experiences/inquiries.
  await db
    .insert(schema.users)
    .values(out.users)
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: sqlExcluded("email"),
        phone: sqlExcluded("phone"),
        fullName: sqlExcluded("full_name"),
        role: sqlExcluded("role"),
        isHost: sqlExcluded("is_host"),
        isAdmin: sqlExcluded("is_admin"),
        isInternal: sqlExcluded("is_internal"),
        status: sqlExcluded("status"),
        updatedAt: new Date(),
      },
    });
  out.report.entities.users.imported = out.users.length;

  if (out.paymentAccounts.length) {
    await db
      .insert(schema.paymentAccounts)
      .values(out.paymentAccounts)
      .onConflictDoNothing({ target: schema.paymentAccounts.userId });
    out.report.entities.paymentAccounts.imported = out.paymentAccounts.length;
  }

  if (out.properties.length) {
    await db
      .insert(schema.properties)
      .values(out.properties.map((p) => ({ ...p, importedAt: new Date() })))
      .onConflictDoUpdate({
        target: schema.properties.slug,
        set: {
          name: sqlExcluded("name"),
          type: sqlExcluded("type"),
          baseNightlyPricePaise: sqlExcluded("base_nightly_price_paise"),
          cancellationPolicy: sqlExcluded("cancellation_policy"),
          raw: sqlExcluded("raw"),
          updatedAt: new Date(),
        },
      });
    out.report.entities.properties.imported = out.properties.length;
  }

  if (out.experiences.length) {
    await db
      .insert(schema.experiences)
      .values(out.experiences.map((e) => ({ ...e, importedAt: new Date() })))
      .onConflictDoUpdate({
        target: schema.experiences.slug,
        set: {
          name: sqlExcluded("name"),
          priceFromPaise: sqlExcluded("price_from_paise"),
          hostPersonaId: sqlExcluded("host_persona_id"),
          cancellationPolicyText: sqlExcluded("cancellation_policy_text"),
          raw: sqlExcluded("raw"),
          updatedAt: new Date(),
        },
      });
    out.report.entities.experiences.imported = out.experiences.length;
  }

  if (out.inquiries.length) {
    await db
      .insert(schema.storedInquiries)
      .values(out.inquiries.map((q) => ({ ...q, importedAt: new Date() })))
      .onConflictDoUpdate({
        target: schema.storedInquiries.id,
        set: {
          status: sqlExcluded("status"),
          raw: sqlExcluded("raw"),
          legacyUpdatedAt: sqlExcluded("legacy_updated_at"),
          updatedAt: new Date(),
        },
      });
    out.report.entities.inquiries.imported = out.inquiries.length;
  }

  console.log(renderReport(out.report));
  console.log("\nEXECUTE complete — data upserted idempotently.");
  await closeDb();
}

/** `excluded.<column>` reference for ON CONFLICT DO UPDATE upserts. */
function sqlExcluded(column: string) {
  return sql.raw(`excluded."${column}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
