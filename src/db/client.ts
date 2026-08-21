/**
 * Database client (Drizzle + postgres.js).
 *
 * Phase 1B.5 foundation. The connection is created LAZILY so that:
 *   • importing the schema / helpers never opens a socket (tests, build, and
 *     the still-JSON-backed app all import freely);
 *   • no production credentials are required to run Phase A.
 *
 * Configuration comes exclusively from the DATABASE_URL environment variable.
 * Never hard-code credentials. See .env.example for the expected shape.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** Build the Drizzle instance; the return type captures the schema generic so
 *  `db.query.<table>` is fully typed. */
function makeDb(sql: ReturnType<typeof postgres>) {
  return drizzle(sql, { schema });
}

let _sql: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof makeDb> | null = null;

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example → .env.local and point it " +
        "at your local PostgreSQL instance before using the database.",
    );
  }
  return url;
}

/** The raw postgres.js client (for migrations / advisory locks / raw SQL). */
export function getSql() {
  if (!_sql) {
    _sql = postgres(connectionString(), {
      // Keep the pool small in dev; the financial services are not hot paths yet.
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      // postgres.js parses NUMERIC as string by default; we only use bigint/int
      // for money, so no special type parsing is needed here.
    });
  }
  return _sql;
}

/** The Drizzle instance bound to the full schema. */
export function getDb() {
  if (!_db) {
    _db = makeDb(getSql());
  }
  return _db;
}

/** Close the pool (tests / graceful shutdown). */
export async function closeDb() {
  if (_sql) {
    await _sql.end({ timeout: 5 });
    _sql = null;
    _db = null;
  }
}

export { schema };
export type Database = ReturnType<typeof getDb>;
