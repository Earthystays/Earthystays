# Local PostgreSQL Setup — Earthy Stays (Phase 1B.5)

The financial foundation uses **PostgreSQL + Drizzle ORM**. The app is still
JSON-backed; the database connection is opened **lazily** and only needed once a
DB code path runs. **Never use production credentials for local development.**

## 1. Install PostgreSQL locally

Pick one. macOS options:

**Postgres.app** (simplest, GUI)
1. Download from https://postgresapp.com and drag to Applications.
2. Open it and click **Initialize** to start a server on `localhost:5432`.
3. Add the CLI tools to your PATH (optional):
   ```bash
   sudo mkdir -p /etc/paths.d && echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
   ```

**Homebrew**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Docker** (isolated, no system install)
```bash
docker run --name earthy-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=earthy_dev -p 5432:5432 -d postgres:16
```

## 2. Create the dev database

Skip if you used the Docker command above (it creates `earthy_dev`).
```bash
createdb earthy_dev
```

## 3. Point the app at it

In `.env.local`:
```
DATABASE_URL=postgres://localhost:5432/earthy_dev
# Docker variant:
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/earthy_dev
```

## 4. Apply the schema

```bash
npm run db:migrate      # applies drizzle/*.sql via drizzle-kit
# or, for rapid local iteration without migration files:
# npm run db:push
```

## 5. Import existing JSON data (Phase B)

Dry-run first (default — writes nothing, prints the full migration report):
```bash
npm run db:import
```

Execute the import (idempotent upserts; safe to re-run):
```bash
npm run db:import -- --execute
```

## Useful commands

| Command | What it does |
|---|---|
| `npm run db:generate` | Regenerate SQL migrations from `src/db/schema` (no DB needed) |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio to browse the DB |
| `npm run db:import` | Dry-run JSON → PostgreSQL migration report |
| `npm run db:import -- --execute` | Perform the import (idempotent) |

## Notes

- The migration is **non-destructive**: it never edits or deletes `data/*.json`.
  A timestamped backup of all JSON lives in `data-backups/` (gitignored).
- The importer creates **no financial records** (no payments, refunds, payouts,
  ledger entries, or bookings) from legacy data.
- Legacy villas have no host and are treated as **Earthy-owned** (`host_id`
  null); an internal Earthy entity + payment account is seeded automatically.
- Experience `hostId`s are **marketing personas**, not payout users; every
  experience is flagged in the report for manual host mapping.
