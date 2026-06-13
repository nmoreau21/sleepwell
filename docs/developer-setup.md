# Developer setup checklist

Use this checklist before manual testing or pilot prep. Assumes macOS/Linux with Node 20+.

## 1. Clone and install

- [ ] Clone the repo and `cd sleepwell`
- [ ] `npm install`
- [ ] Copy env: `cp .env.example .env.local`

## 2. Supabase project

- [ ] Create a **dev** Supabase project (separate from production)
- [ ] Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy **service role key** → `SUPABASE_SERVICE_ROLE_KEY` (server only)
- [ ] Copy **Database connection string** (pooler, port 6543) → `DATABASE_URL`
- [ ] Optional: direct connection (port 5432) → `DATABASE_DIRECT_URL` for `npm run db:migrate` if pooler auth fails

## 3. Supabase Auth

- [ ] Authentication → Providers → Email: enable **Magic Link**
- [ ] Authentication → URL configuration:
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/auth/callback`
- [ ] Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`

## 4. Database migrations

- [ ] `npm run db:migrate` (applies `0000`–`0012`, including `impact_records`)
- [ ] Verify: `curl http://localhost:3000/api/health/db` returns OK after `npm run dev`

## 5. Provision admin coordinator

- [ ] Edit `scripts/provision-admin.sql` with your coordinator email
- [ ] Run in Supabase SQL editor (creates `users` row + admin role)
- [ ] First login at `/login` with that email links `auth_id` on callback

## 6. Optional: partner + seed fixtures

- [ ] Run `scripts/provision-partner.sql` (referral code `HOPE-2026`)
- [ ] Run `scripts/seed-dev-loop.sql` for a pre-built dresser item + request in ZIP `90012`
  - Skips public forms; still requires admin review steps in the test plan

## 7. Email (Step 11 communications)

Required only to **send** transfer emails from `/admin/communications`:

- [ ] Resend account + verified domain (or Resend sandbox for dev)
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM` (must be allowed by Resend)
- [ ] `EMAIL_REPLY_TO` (optional but recommended)

Without Resend, the app still queues communications; preview/send will show a config error.

## 8. Run the app

```bash
npm run dev
```

- [ ] Home: http://localhost:3000
- [ ] Health: http://localhost:3000/api/health
- [ ] Admin (after login): http://localhost:3000/admin

## 9. Validation scripts (no DB required for scoring rules)

```bash
npm run validate:matching
npm run validate:match-create
npm run validate:schedule-transfer
npm run validate:transfer-completion
```

## 10. Production build smoke test

```bash
npm run build
npm run start
```

## Common issues

| Symptom | Fix |
|---------|-----|
| `/login?error=not_provisioned` | Run `provision-admin.sql`; email must match login |
| `/login?error=forbidden` | User missing admin role (`role_id = 5`) |
| `db:migrate` fails | Check `DATABASE_URL`, pooler password, IP allowlist |
| Communications send fails | Set `RESEND_API_KEY` and `EMAIL_FROM` |
| No connections on dashboard | Item must be `available`; request `approved` or `queued`; same category |
| Match create fails | Item status `available`, need line `open`, request matchable |

## Related docs

- [MVP test plan](mvp-test-plan.md) — full loop manual test
- [Technical architecture](technical-architecture.md) — MVP build sequence
- [README](../README.md) — stack overview
