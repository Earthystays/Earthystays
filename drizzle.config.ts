/**
 * Drizzle Kit configuration — Phase 1B.5 financial foundation.
 *
 * `drizzle-kit generate` reads src/db/schema and writes SQL migrations to
 * ./drizzle. Generation does NOT require a live database. Applying migrations
 * (`db:migrate` / `db:push`) requires DATABASE_URL to point at PostgreSQL.
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Only read at apply-time; generation ignores this.
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/earthy_dev",
  },
  strict: true,
  verbose: true,
});
