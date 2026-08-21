/**
 * Database smoke test — Phase 1B.5 (step 13).
 *
 * Skipped until DATABASE_URL is set. Verifies the most basic contract against a
 * real PostgreSQL: connect, insert a record inside a transaction, read it back,
 * then roll the transaction back so nothing persists (self-cleaning). Also
 * confirms the schema is migrated (the `users` table is queryable).
 */
import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "./client";
import * as schema from "./schema";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("database smoke test", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("connects and reports the server version", async () => {
    const db = getDb();
    const rows = (await db.execute(sql`select version() as v`)) as unknown as Array<{ v: string }>;
    expect(rows[0]?.v).toMatch(/PostgreSQL/);
  });

  it("inserts inside a transaction, reads it, then rolls back (no residue)", async () => {
    const db = getDb();
    const id = `usr_smoke_${Date.now()}`;

    class Rollback extends Error {}
    try {
      await db.transaction(async (tx) => {
        await tx.insert(schema.users).values({ id, email: `${id}@example.com`, fullName: "Smoke Test", role: "guest" });
        const found = await tx.query.users.findFirst({ where: sql`${schema.users.id} = ${id}` });
        expect(found?.id).toBe(id);
        throw new Rollback(); // force rollback — leave the DB clean
      });
    } catch (e) {
      if (!(e instanceof Rollback)) throw e;
    }

    // The row must NOT exist after rollback.
    const after = await db.query.users.findFirst({ where: sql`${schema.users.id} = ${id}` });
    expect(after).toBeUndefined();
  });
});
