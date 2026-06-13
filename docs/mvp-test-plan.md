# MVP test plan — Steps 1–12

Manual test plan for the coordinator loop through pilot readiness. No automated E2E suite yet; use this checklist before demos or pilot launch.

**Full loop:** donate → review item → refer/request → review request → connection → match → schedule transfer → complete transfer → send communications → view impact.

---

## Steps 1–12 implementation review

| Step | Deliverable | Routes / artifacts | Status | Notes |
|------|-------------|-------------------|--------|-------|
| 1 | Project setup | Next.js, Tailwind, Drizzle | Done | `npm run build` passes |
| 2 | Database | `db/schema/`, migrations `0000`–`0012` | Done | 15 MVP tables + `impact_records` |
| 3 | Auth / admin | `/login`, `/admin/*`, `requireAdmin()` | Done | Magic link; provision SQL required |
| 4 | Donor intake | `/donate`, `/donate/success` | Done | No photo upload (deferred) |
| 5 | Partner referral | `/refer`, `/refer/success` | Done | Partner code + self-request path |
| 6 | Admin queues | `/admin/items`, `/admin/requests` | Done | Status filters + audit on change |
| 7 | Connections | `/admin/connections` | Done | Zip/city scoring; `validate:matching` |
| 8 | Manual match | Create match from connections | Done | Match → `/admin/matches/[id]` |
| 9 | Schedule transfer | Match detail scheduling form | Done | Match → `scheduled` |
| 10 | Transfer completion | Complete / fail / cancel | Done | Cascades item/need/request |
| 11 | Communications | `/admin/communications` | Done | Manual send for 4 transfer templates only |
| 12 | Impact / reporting | `/admin/impact` | Done | Auto record on complete; story toggle only |

**Intentionally deferred (not bugs):** photo uploads, Turnstile wiring, donor/recipient dashboards, partner portal, SMS, background jobs, public story publishing, tax receipts, AI, maps/geocoding.

---

## Route checklist (smoke)

| Route | Auth | Expected |
|-------|------|----------|
| `/` | Public | Home loads |
| `/donate` | Public | Donation form |
| `/donate/success` | Public | Success message |
| `/refer` | Public | Referral form (partner + self) |
| `/refer/success` | Public | Success message |
| `/login` | Public | Magic link form |
| `/auth/callback` | OAuth | Redirect after magic link |
| `/admin` | Admin | Dashboard cards |
| `/admin/items` | Admin | Item review queue |
| `/admin/requests` | Admin | Request review queue |
| `/admin/connections` | Admin | Supply/demand + pairings |
| `/admin/matches/[id]` | Admin | Schedule + complete transfer |
| `/admin/communications` | Admin | Queued email preview/send |
| `/admin/impact` | Admin | Impact + operations metrics |
| `/api/health` | Public | `{ ok: true }` |
| `/api/health/db` | Public | DB connectivity |

Unauthenticated `/admin` → redirect to `/login`. Non-admin user → `/login?error=forbidden`.

---

## Full loop test (happy path)

**Prerequisites:** [Developer setup](developer-setup.md) complete; optional `seed-dev-loop.sql` OR use forms below.

### A. Donate (or seed)

**Form path**

1. Open `/donate`
2. Submit: category **Dresser**, condition **Good**, quantity **1**
3. Location: **Los Angeles, CA 90012** (match seed ZIP if using fixtures)
4. Use a real email you can read (for later comms tests)
5. Expect redirect to `/donate/success`
6. **Verify:** `/admin/items` → status `submitted`

**Seed path**

1. Run `scripts/seed-dev-loop.sql`
2. **Verify:** item `dev-donor@sleepwell.dev`, dresser, `submitted`

### B. Review item

1. `/admin/items` (Review queue)
2. Set status → **Under review** (optional)
3. Set status → **Available** (required for matching; not `approved` alone)
4. **Verify:** item status `available`; filter `available` shows the item

### C. Refer / request (or seed)

**Form path (partner)**

1. `/refer` → **Partner referral**
2. Code `HOPE-2026` (after `provision-partner.sql`)
3. Need line: **Dresser**, essential, qty **1**
4. Same ZIP **90012** as donor item
5. **Verify:** `/admin/requests` → status `submitted`

**Self-request path**

1. `/refer` → **Request for yourself**
2. Expect status `pending_verification` until admin reviews

### D. Review request

1. `/admin/requests`
2. Approve → status `approved`
3. Queue for matching → status `queued`
4. **Verify:** need line still `open`

### E. Connection

1. `/admin/connections`
2. **Verify:** dresser pairing appears with score reasons (e.g. Same category, Same ZIP)
3. Note item + need line IDs if testing without UI

### F. Create match

1. Click **Create match** on the pairing card
2. **Verify:** redirect success; `/admin/matches/[id]` loads
3. **Verify:** item `reserved`, need `matched`, request `partially_matched` or `matched`
4. **Verify:** queued comms for `match_created_*` (not sendable in MVP)

### G. Schedule transfer

1. On match detail: method **Recipient pickup**
2. Start/end datetime (end after start)
3. Confirm donor contact (checkbox)
4. Submit schedule
5. **Verify:** match `scheduled`, item `transfer_scheduled`, transfer `scheduled`
6. **Verify:** `/admin/communications` shows `transfer_scheduled_donor` + `transfer_scheduled_recipient` queued

### H. Complete transfer

1. Outcome **Completed**
2. Completion time (defaults to now)
3. Submit
4. **Verify:** transfer `completed`, match `completed`, item `transferred`, need `fulfilled`
5. **Verify:** request `fulfilled` (if all essential lines done)
6. **Verify:** `/admin/impact` — new impact record, privacy-safe summary (no names in summary text)

### I. Send communications

1. `/admin/communications`
2. **Preview** (dry run) — eligible count includes sendable templates
3. If Resend configured: **Send eligible** — expect `transfer_scheduled_*` and `transfer_completed_*` sent
4. **Verify:** audit `communication.sent` / `communication.failed` in DB if inspecting `audit_log`

### J. View impact

1. `/admin/impact`
2. **Verify:** completed transfers, impact records, category counts, operations cards
3. Toggle **Approve story for future public use** on a record
4. **Verify:** `story_public_approved` true; audit `impact_record.story_approval_changed`
5. **Verify:** no public story page exists (by design)

---

## Exception paths (spot check)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Invalid partner code | `/refer` with bad code | Error on form |
| Match wrong category | Connections only shows same category | No cross-category pairing |
| Schedule without contacts | Schedule form unchecked | Validation error on match page |
| Complete before schedule | Try complete on `approved` match | `MATCH_NOT_SCHEDULED` message |
| Failed transfer | Complete → failed + reason | Item reopen or keep reserved per choice |
| Duplicate impact | Complete same match twice | Only one impact record (`uq_impact_records_match`) |
| Email not configured | Send on communications page | Config error banner, no crash |

---

## Data verification (optional SQL)

```sql
-- Latest item / request / match / transfer / impact
SELECT id, status, category FROM furniture_items ORDER BY created_at DESC LIMIT 3;
SELECT id, status FROM recipient_requests ORDER BY created_at DESC LIMIT 3;
SELECT id, status FROM matches ORDER BY created_at DESC LIMIT 3;
SELECT id, status, completed_at FROM transfers ORDER BY created_at DESC LIMIT 3;
SELECT id, match_id, impact_summary, story_public_approved FROM impact_records ORDER BY created_at DESC LIMIT 3;
```

---

## Pre-pilot sign-off

- [ ] Full happy path completed once on dev Supabase
- [ ] Full happy path completed once on staging (if used)
- [ ] `npm run build` clean
- [ ] All four `validate:*` scripts pass
- [ ] Coordinator provisioned on production Supabase
- [ ] Resend domain verified for production `EMAIL_FROM`
- [ ] Supabase redirect URLs set for production domain
- [ ] Pilot geography and partner codes documented for coordinators

---

## Related

- [Developer setup](developer-setup.md)
- [Workflows](workflows.md)
- [User types](user-types.md)
