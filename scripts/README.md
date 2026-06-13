# Scripts

## Migrations

- Apply: `npm run db:migrate` (uses `scripts/db-migrate.ts`; reads `DATABASE_DIRECT_URL` or `DATABASE_URL` from `.env.local`)
- Generate from schema: `npm run db:generate`

Migrations are incremental and non-destructive (`CREATE TABLE IF NOT EXISTS`). Apply only against dev/staging Supabase — not production without review.

## Provisioning (Supabase SQL editor)

| Script | Purpose |
|--------|---------|
| `provision-admin.sql` | Coordinator user + admin role |
| `provision-partner.sql` | Sample partner org (`HOPE-2026`) |

## Dev fixtures

| Script | Purpose |
|--------|---------|
| `seed-dev-loop.sql` | Idempotent dresser item + partner request in ZIP 90012 |

See [docs/mvp-test-plan.md](../docs/mvp-test-plan.md) for the full manual test loop.

## Validation (local, no DB)

```bash
npm run validate:matching
npm run validate:match-create
npm run validate:schedule-transfer
npm run validate:transfer-completion
```
