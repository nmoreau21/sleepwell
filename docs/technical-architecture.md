# Sleepwell Technical Architecture

**Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Master Technical Reference

---

## Related Documents

- [Constitution](constitution.md) — mission guardrails; technology must reduce friction, not gatekeep
- [Roadmap](roadmap.md) — phased delivery plan
- [Workflows](workflows.md) — operational processes the software must support
- [Database Design](database-design.md) — schema, statuses, and privacy fields
- [User Types](user-types.md) — roles, permissions matrix, MVP auth strategy
- [Mission](mission.md) — (planned)
- [Operating Model](operating-model.md) — (planned)

---

## 1. Executive Summary

Sleepwell should be built as a **single Next.js application** deployed on **Vercel**, backed by **Supabase PostgreSQL**, with **admin-only authentication** in the first release. Public donors and partner referrers submit through **simple forms** without logging in. Coordinators use an **internal admin dashboard** to review items, approve requests, manually match furniture to needs, schedule pickups, and log transfer completion.

Photos live in **Supabase Storage**. Transactional email goes through **Resend**. There is **no maps integration in MVP**—matching uses zip code and city until Phase 4.

This architecture is intentionally boring: one repo, one deploy target, one database, minimal vendors. It supports the nonprofit’s core principle—**direct donor-to-recipient transfer**—without building warehouse inventory software. Complexity arrives in later phases only when operational data proves the need: match scoring (Phase 2), self-service dashboards (Phase 3), partner portal (Phase 4–6), volunteer task claiming (Phase 5), geocoding and routing (Phase 6), and AI assistance (Phase 7).

A small team using Cursor should be able to ship Phase 1 in vertical slices: database → admin auth → donor form → partner referral form → approval queues → manual match → transfer status → email notifications.

---

## 2. Core Architecture Philosophy

| Principle | What It Means in Practice |
|-----------|---------------------------|
| **MVP first** | Ship coordinator workflows before donor dashboards; forms before portals |
| **Human approval before automation** | Every match requires coordinator approval; scoring suggests, humans decide |
| **Privacy by design** | Exact addresses stored in DB but never returned to unauthorized API responses; RLS enforces scope |
| **Direct transfer support** | Data model tracks donor-held items and transfers—not warehouse stock levels |
| **Modular services** | `services/` modules with clear boundaries; monolith today, extractable tomorrow |
| **Low operating cost** | Supabase + Vercel free/low tiers; Resend free tier; no Mapbox until needed |
| **Avoid premature complexity** | No microservices, no Kubernetes, no ML pipeline, no multi-tenant until Phase 8 |

**Monolith first.** One Next.js app owns UI, API, and background triggers until Phase 7+ volume demands extraction.

**API-ready modules.** Business logic lives in `services/`, not in React components, so a public API later is packaging—not rewrite.

**Event-friendly state changes.** Status transitions (item approved, match approved, transfer completed) call a single `audit` + `notify` hook pattern even in MVP.

**Low-tech parity.** Phone and coordinator-created records are first-class; not everyone gets a login.

---

## 3. Recommended MVP Stack

One recommended stack—not a menu of options.

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | **Next.js 15** (App Router) + **React** + **TypeScript** | SEO for public site; server components for admin; single codebase for marketing + dashboards ([Roadmap](roadmap.md)) |
| **UI** | **Tailwind CSS** + **shadcn/ui** | Fast, accessible components; low design overhead; great Cursor/AI codegen fit |
| **Backend** | **Next.js Server Actions** + **Route Handlers** | No separate API server; colocated with UI; simple deploy on Vercel |
| **ORM** | **Drizzle ORM** | Lightweight, SQL-transparent, excellent TypeScript; migrations in repo |
| **Database** | **PostgreSQL via Supabase** | Managed Postgres; row-level security; aligns with [Database Design](database-design.md); PostGIS available later |
| **Auth** | **Supabase Auth** (admin-only MVP) | Magic link for coordinators; same vendor as DB; expands to donor/recipient in Phase 3 |
| **Storage** | **Supabase Storage** | Item photos; private buckets; signed URLs for admin; simple RLS policies |
| **Hosting** | **Vercel** | Zero-config Next.js; preview deployments; edge-friendly |
| **Email** | **Resend** | Simple API, good deliverability, React Email templates |
| **SMS** | **Deferred** (Twilio in Phase 5) | Email + phone coordination sufficient for MVP |
| **Maps** | **Deferred** (Mapbox in Phase 6) | Zip-based matching avoids API cost and privacy risk in MVP |
| **Background jobs** | **Inngest** (Phase 2+) | Vercel-native; match notifications, reminders, geocoding jobs; skip for MVP except sync email |
| **Monitoring** | **Sentry** + **Vercel Analytics** | Error tracking + basic traffic; add **PostHog** in Phase 3 for product analytics |
| **Spam protection** | **Cloudflare Turnstile** on public forms | Free tier; no Google reCAPTCHA dependency |

### Why Not Other Options (MVP)

| Alternative | Why Not MVP Default |
|-------------|---------------------|
| Separate Node API | Extra deploy and auth surface; unnecessary for team size |
| Clerk | Excellent auth, but adds vendor + cost; Supabase Auth covers MVP + RLS integration |
| Neon alone | Great Postgres, but you'd still need Auth + Storage elsewhere; Supabase bundles MVP needs |
| SQLite | No RLS, weak multi-user admin concurrency; Postgres from day one |
| Airtable as primary DB | Fine for week-1 validation only; migration pain; doesn't scale permissions model |
| Cloudinary | Strong for images, but Supabase Storage is enough for furniture photos |
| Google Maps | Higher cost at scale; Mapbox or OSM stack chosen in Phase 6 with deliberate evaluation |

### Cost Expectation (MVP)

| Service | Typical MVP Cost |
|---------|------------------|
| Vercel | $0–20/mo |
| Supabase | $0–25/mo |
| Resend | $0–20/mo |
| Sentry | $0 |
| Domain | ~$15/year |

Target: **under $50/month** until hundreds of monthly transfers.

---

## 4. Phase-Based Architecture

### Phase 1 — Forms + Admin + Manual Matching

**Goal:** Replace spreadsheet coordination with a real database and admin UI.

| Component | Implementation |
|-----------|----------------|
| Public site | Next.js static/SSR pages: mission, how-it-works, donate form, partner referral form |
| Admin | `/admin/*` routes behind Supabase Auth; role check `admin` |
| Data | Drizzle schema matching MVP tables in [Database Design](database-design.md) |
| Matching | Coordinator selects item + need line in UI; creates `matches` row |
| Transfers | Coordinator schedules pickup; updates `transfers` status |
| Photos | Upload to Supabase Storage on donor form |
| Email | Resend on submission received; optional on status change |
| Maps | None—zip and city on forms |

### Phase 2 — Match Scoring + Workflow Hardening

**Goal:** Suggest matches; keep human approval.

| Addition | Implementation |
|----------|----------------|
| Match candidates | `match_candidates` table; `services/matching/score.ts` |
| Scoring | Zip adjacency table + urgency + partner tier; no lat/long yet |
| Notifications | Inngest jobs: match expiry, incomplete submission reminders |
| Audit | Full `audit_log` writes on every status change |
| Admin UX | Ranked suggestions panel on match screen |

### Phase 3 — Donor & Recipient Dashboards

**Goal:** Self-service status; reduce coordinator phone load.

| Addition | Implementation |
|----------|----------------|
| Auth expansion | Supabase magic links for `donor` and `recipient` roles |
| Dashboards | `/dashboard/donor`, `/dashboard/recipient` |
| RLS policies | Row ownership by `user_id` / profile linkage |
| PostHog | Funnel and dashboard adoption metrics |

### Phase 4 — Partner Portal

**Goal:** Partners submit and track referrals without emailing coordinators.

| Addition | Implementation |
|----------|----------------|
| Partner auth | `partner_user` role; org scoping via `partner_organization_id` |
| Portal | `/dashboard/partner` — referrals list, client status |
| Partner Admin | Org-wide view; staff invites (Phase 6 refinement) |
| Fast-track flags | Partner tier affects queue sort, not auto-approve (default) |

### Phase 5 — Volunteer Network

**Goal:** Volunteers claim delivery tasks.

| Addition | Implementation |
|----------|----------------|
| Volunteer profiles | Skills, vehicle, waiver |
| Task board | Open `transfers` needing `volunteer_delivery` |
| Assignments | `volunteer_assignments` table |
| SMS | Twilio for day-of delivery reminders |
| Scoped address API | Volunteers see addresses only for accepted assignments |

### Phase 6 — Mapping, Geocoding, Routing

**Goal:** Distance-based matching and route-aware coordination.

| Addition | Implementation |
|----------|----------------|
| Geocoding | Background job: Nominatim (dev/low volume) or **Mapbox** (production) |
| PostGIS | `latitude`/`longitude` on items and requests |
| Admin map | Cluster view at zip level; exact pins admin-only |
| Distance scoring | Haversine or drive-time via Mapbox Matrix API (budget cap) |

### Phase 7 — Automation & AI Assistance

**Goal:** Copilot for coordinators—not autonomous decisions.

| Addition | Implementation |
|----------|----------------|
| Photo classification | Vision API on `item_photos`; suggest category/condition |
| Match copilot | LLM explains score breakdown; draft coordinator messages |
| Demand signals | Aggregate analytics on open needs vs supply |
| Rule | AI never auto-approves matches or publishes donor/recipient PII |

---

## 5. Application Structure

Recommended repository layout (aligned with existing `app/` scaffold):

```
sleepwell/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Marketing + public forms (no auth)
│   │   ├── page.tsx              # Home
│   │   ├── donate/               # Donor intake form
│   │   ├── refer/                # Partner referral form
│   │   └── how-it-works/
│   ├── (auth)/                   # Login callbacks
│   │   └── login/
│   ├── admin/                    # Coordinator console (auth required)
│   │   ├── layout.tsx            # Admin shell + auth guard
│   │   ├── page.tsx              # Pipeline dashboard
│   │   ├── items/                # Furniture item queue
│   │   ├── requests/             # Recipient request queue
│   │   ├── matches/              # Manual matching UI
│   │   ├── transfers/            # Pickup/delivery schedule
│   │   └── partners/             # Partner org list (basic)
│   ├── dashboard/                # Phase 3+ role dashboards
│   │   ├── donor/
│   │   ├── recipient/
│   │   ├── partner/
│   │   └── volunteer/
│   └── api/                      # Route Handlers (webhooks, uploads)
│       ├── webhooks/
│       └── health/
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── forms/                    # Donate, refer, admin forms
│   ├── admin/                    # Tables, pipeline cards, match UI
│   └── layout/                   # Header, footer, nav
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (cookies)
│   │   └── admin.ts              # Service role (server only, guarded)
│   ├── auth/
│   │   ├── session.ts            # getSession, requireAdmin
│   │   └── permissions.ts        # Role checks per user-types.md
│   └── utils/                    # Dates, formatting, zip helpers
├── db/
│   ├── schema/                   # Drizzle table definitions
│   │   ├── users.ts
│   │   ├── furniture-items.ts
│   │   └── ...
│   ├── migrations/               # Drizzle SQL migrations
│   └── index.ts                  # db client export
├── actions/                      # Server Actions (thin wrappers)
│   ├── donate.ts
│   ├── refer.ts
│   ├── approve-item.ts
│   └── create-match.ts
├── services/                     # Business logic (no React)
│   ├── items/
│   ├── requests/
│   ├── matching/
│   ├── transfers/
│   ├── communications/
│   ├── audit/
│   └── privacy/                  # Address visibility rules
├── types/                        # Shared TS types, enums
│   └── statuses.ts               # Mirror database-design enums
├── emails/                       # React Email templates
├── docs/                         # Constitution, workflows, this file
├── scripts/
│   ├── seed.ts                   # Dev seed data
│   └── migrate.ts
└── tests/
    ├── services/                 # Unit tests for matching, privacy
    └── e2e/                      # Playwright (Phase 2+)
```

### What Belongs Where

| Location | Responsibility |
|----------|----------------|
| `app/` | Routing, layouts, page composition, auth boundaries |
| `components/` | Presentational UI; minimal business logic |
| `actions/` | Server Actions: validate input, call `services/`, revalidate paths |
| `services/` | All domain rules: status transitions, matching, privacy filtering |
| `db/schema/` | Drizzle models only—no business logic |
| `lib/auth/` | Session and permission helpers |
| `lib/supabase/` | Client factories; never import service role in client code |
| `types/` | Status unions shared across app and services |
| `emails/` | Resend/React Email templates |

**Rule:** Components and actions do not query the database directly except through `services/` or `db` helpers called from services.

---

## 6. Data Flow

### Donor Submits Item

```
Public Visitor
    │
    ▼
[donate form] ──► Server Action: submitDonation()
    │
    ├──► services/items.createFromPublicForm()
    │         ├── insert users (if new) + donor_profiles
    │         ├── insert furniture_items (status: submitted)
    │         └── upload photos → Supabase Storage
    │
    ├──► services/audit.log('furniture_item.created')
    ├──► services/communications.sendSubmissionReceived()
    └──► Resend email to donor + admin alert

Coordinator sees item in admin/items queue (status: submitted)
```

### Partner / Recipient Request

```
Partner User (referral form + referral_code)
    │
    ▼
[refer form] ──► Server Action: submitReferral()
    │
    ├──► validate partner_organizations.referral_code
    ├──► services/referrals.create()
    │         ├── partner_referrals (submitted)
    │         ├── users + recipient_profiles (if new)
    │         ├── recipient_requests (submitted)
    │         └── request_need_lines
    │
    ├──► audit + email notifications
    └──► Admin queue: requests + referrals
```

### Admin Review & Approval

```
Coordinator (admin UI)
    │
    ├── approveItem(itemId) ──► status: available | rejected
    │         └── audit_log + optional donor email
    │
    └── approveRequest(requestId) ──► status: queued
              └── audit_log + partner email
```

### Match Created (Manual MVP)

```
Coordinator (admin/matches)
    │
    ├── select furniture_item (available)
    ├── select request_need_line (open)
    │
    ▼
services/matching.createMatch()
    ├── validate: one active match per item
    ├── insert matches (pending_review → approved)
    ├── update item status: reserved
    ├── update need line status: matched
    ├── audit_log (match.approved, approver_id)
    └── notify donor + recipient/partner (email)

Phase 2: scoreCandidates() runs before UI shows ranked list
```

### Transfer Scheduled & Completed

```
Coordinator
    │
    ├── scheduleTransfer(matchId, type: pickup | volunteer_delivery)
    │         ├── insert transfers (scheduled)
    │         ├── item: transfer_scheduled
    │         └── match: scheduled
    │
    └── completeTransfer(transferId)
              ├── transfers: completed
              ├── item: transferred
              ├── need line: fulfilled (increment quantity_matched)
              ├── request: partially_matched | fulfilled
              ├── match: completed
              └── trigger impact workflow (Phase 4+)
```

### Donor Impact Recorded (Phase 4+)

```
Transfer completed
    │
    ▼
services/impact.createFromTransfer()
    ├── impact_records (pending_impact → impact_recorded)
    ├── communications: thank-you email
    └── tax_receipts (admin-triggered, Phase 4+)
```

---

## 7. Authentication and Authorization

### MVP Auth Strategy

| Actor | MVP Auth |
|-------|----------|
| Public visitor | No auth |
| Donor | No auth; form creates records |
| Recipient | No auth; partner form or coordinator creates |
| Partner | No auth; referral form with `referral_code` |
| Coordinator / Admin | **Supabase Auth** magic link or email/password |

**Implementation:**

1. Supabase Auth issues session cookie via `@supabase/ssr`.
2. `app/admin/layout.tsx` calls `requireAdmin()` → redirects to `/login` if no session or missing `admin` role in `user_roles`.
3. Service role key used **only** in server-side `lib/supabase/admin.ts` for Storage uploads from public forms (or use signed upload URLs).

### Role-Based Access Control

Align with [User Types](user-types.md):

| Phase | Roles in Code |
|-------|---------------|
| MVP | `admin` only for `/admin/*` |
| Phase 3 | + `donor`, `recipient` for `/dashboard/*` |
| Phase 4 | + `partner_user` |
| Phase 5 | + `volunteer` |
| Phase 6 | + `board_viewer` (read-only routes) |

**Permission checks:**

```typescript
// lib/auth/permissions.ts pattern
can(user, 'approve_match')     // coordinator+
can(user, 'view_exact_address', { entity, stage })  // privacy service
```

Application-layer checks in `services/` + Supabase **RLS** on Postgres for defense in depth.

### Future Logins

- **Donor/Recipient:** Magic link (low friction; matches Constitution accessibility)
- **Partner:** Email/password or magic link tied to `partner_users`
- **Volunteer:** Magic link after waiver completion

### Privacy Rules for Addresses & Contacts

Enforced in `services/privacy/`—not in components:

| Stage | Donor address visible to |
|-------|--------------------------|
| Public browse | Nobody |
| Match approved | Coordinator; recipient sees city/zip only |
| Transfer scheduled | Recipient (pickup) or assigned volunteer (pickup address only) |

API responses use **DTO mappers** that strip fields based on `viewerRole` and workflow stage. Never return raw DB rows to clients.

---

## 8. Security and Privacy

### Protected Addresses

- Store `address_line1` in Postgres; optional application-level encryption later
- Public API and donor/recipient DTOs exclude exact address until policy allows
- Log `address.viewed` in `audit_log` when coordinator opens detail panel (Phase 2)

### Contact Information

- Phone/email on `users` table; scoped by role
- Partner case notes in separate fields never included in donor/volunteer API responses

### Row-Level Access Strategy

| Phase | Strategy |
|-------|----------|
| MVP | Admin service role bypasses RLS; admin UI only |
| Phase 3+ | Supabase RLS policies per table |
| | Donors: `furniture_items.donor_profile_id` → own `user_id` |
| | Partners: `partner_organization_id` match |
| | Volunteers: assignment-scoped views (SQL function or app filter) |

### Audit Logging

Every write in `services/` calls `audit.log()`:

- Status changes
- Match approve/reject/override
- Transfer schedule/complete
- Role grants
- Export requests

`audit_log` table is append-only; no UPDATE/DELETE in application code.

### File Upload Safety

- Max 5 MB per photo; max 5 photos per item
- Accept `image/jpeg`, `image/png`, `image/webp` only
- Server validates MIME type and dimensions
- Storage path: `items/{item_id}/{uuid}.webp` (convert to webp server-side if needed)
- Private bucket; signed URLs expire in 15 minutes
- No executable extensions

### Public Form Spam Prevention

- Cloudflare Turnstile on donate and refer forms
- Honeypot field
- Rate limit by IP in Route Handler (Vercel KV or Upstash Redis—optional Phase 2)
- Duplicate submission detection (same email + category within 24h)

### Admin Activity Tracking

- `audit_log.actor_user_id` on all admin actions
- Sentry breadcrumbs for admin errors with user id (no PII in Sentry payloads)

### Data Retention Basics

- Active operational data retained indefinitely while mission-relevant
- Closed requests/items: anonymize after 24 months (policy TBD)
- `communications.body_preview` truncated; full content not stored long-term
- Soft delete via `deleted_at` on users and items

---

## 9. Maps and Location Strategy

### MVP (Phase 1–3)

- Collect: `city`, `state`, `zip_code` on donor items and recipient requests
- Optional: `cross_street` for donor display privacy
- **Do not collect exact address on public donor form** if avoidable—collect at coordinator approval or post-match scheduling
- Matching: same zip or static `zip_adjacency` table
- No map widgets on public site

### Phase 4–6

1. Background job geocodes on `approved` status (not on public submit)
2. Store `latitude`, `longitude` on items/requests
3. Admin map shows **clusters by zip**, not pins, for pipeline view
4. Distance score in matching service
5. Volunteer route view for assigned tasks only

### Privacy Rules

- Never expose lat/long to donors, recipients, or partners in API responses
- `display_location` string for human-readable area ("Downtown LA")
- Mapbox/Google tokens server-side only

---

## 10. Photo Upload Strategy

### Flow

1. Donor form selects photos client-side
2. On submit: create `furniture_items` row first (get `id`)
3. Upload files via Server Action to Supabase Storage using service role or user-scoped policy
4. Insert `item_photos` rows with storage path

### Bucket Structure

```
storage buckets:
  item-photos (private)
    /pending/{upload_session_id}/...   # optional pre-item upload
    /items/{furniture_item_id}/{photo_id}.webp
```

### Limits

| Rule | Value |
|------|-------|
| Max file size | 5 MB |
| Max photos per item | 5 |
| Min photos for approval | 1 |
| Formats | JPEG, PNG, WebP |

### Future AI Classification (Phase 7)

- On upload complete, enqueue Inngest job
- Vision model returns: suggested `category`, `condition`, `requires_two_person`
- Store in `item_photos.ai_labels` JSONB; coordinator confirms—not auto-approve

---

## 11. Communication Strategy

### MVP Email (Resend)

| Event | Recipient | Template |
|-------|-----------|----------|
| Donation submitted | Donor + admin | `donation-received` |
| Item approved/rejected | Donor | `item-review-result` |
| Referral received | Partner + admin | `referral-received` |
| Request approved | Partner | `request-approved` |
| Match approved | Donor + partner | `match-approved` |
| Transfer scheduled | Donor + partner | `transfer-scheduled` |
| Transfer completed | Donor | `thank-you-impact` (simple MVP) |

### Admin Alerts

- Daily digest email (Phase 2): open submissions, unscheduled matches
- Immediate alert on `emergency` priority referral

### Logging

Insert `communications` row on every send:

- `channel`, `template_code`, `related_entity_type`, `related_entity_id`, `status`

### Future SMS (Phase 5 — Twilio)

- Transfer day reminders
- Volunteer assignment alerts
- Opt-in per `users.communication_preference`

---

## 12. Matching Architecture

### MVP — Manual Matching

```
Admin UI:
  Left panel: available items (filter by category, zip)
  Right panel: queued need lines (filter by category, zip, priority)
  [Create Match] → services/matching.createMatch()
```

Coordinator picks pair; no algorithm required for launch.

### Phase 2 — Rule-Based Scoring

```typescript
// services/matching/score.ts
scoreCandidate(item, needLine, request, partnerOrg) {
  if (item.category !== needLine.category) return null; // hard filter
  return {
    distanceScore: zipDistance(item.zip, request.zip),
    urgencyScore: fromMoveInDate(request.move_in_date),
    priorityScore: partnerOrg.priority_tier,
    deliveryFitScore: recipientNeedsDelivery vs volunteerAvailability,
    total: weightedSum(...)
  }
}
```

- `generateCandidates(itemId)` returns ranked list → `match_candidates` table
- UI shows top 5 with explanation JSON
- Coordinator approves one → `matches` row

### Human Approval Required

- No auto-approve in any phase without board exception
- `approved_by_user_id` required on `matches`
- Override requires `is_override` + `override_reason`

### Phase 7 — AI Assistance

- LLM summarizes candidate list for coordinator
- Draft message to donor/recipient for coordinator review
- Does **not** change scores or statuses without human click

---

## 13. Deployment Strategy

### Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Local** | Development | `localhost:3000` |
| **Preview** | PR previews | Vercel preview URL |
| **Staging** | Pre-prod testing | `staging.sleepwell.org` |
| **Production** | Live | `sleepwell.org` |

### Local Development

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate          # Drizzle against local or Supabase dev project
pnpm dev                 # next dev
```

Use a **separate Supabase project** for dev/staging—not production.

### Environment Variables

```bash
# .env.local (never commit)
DATABASE_URL=postgresql://...          # Supabase pooler
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # server only
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@sleepwell.org
TURNSTILE_SECRET_KEY=
SENTRY_DSN=
# Phase 6+
MAPBOX_ACCESS_TOKEN=
# Phase 5+
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

### Database Migrations

- **Drizzle Kit** generates SQL in `db/migrations/`
- Run migrations in CI before deploy
- Never edit production schema by hand
- Seed script for dev: `pnpm db:seed`

### Backups

- Supabase automatic daily backups (Pro plan for PITR when budget allows)
- Monthly logical export to encrypted storage for MVP manual backup

### Monitoring

- **Sentry:** API and client errors; alert on admin route 5xx
- **Vercel Analytics:** page performance
- **Uptime:** Better Uptime or Vercel monitoring on `/api/health`
- **Supabase dashboard:** DB CPU, connection count

### CI Pipeline (GitHub Actions)

1. Lint + typecheck
2. Unit tests (`services/`)
3. `drizzle-kit check` migrations
4. Deploy preview on PR
5. Deploy production on merge to `main` (manual approval gate)

---

## 14. Development Workflow in Cursor

### Read Docs First

Before implementing a feature, read:

1. [Workflows](workflows.md) — process and statuses
2. [Database Design](database-design.md) — tables and fields
3. [User Types](user-types.md) — who can do what
4. This document — stack and folder conventions

### Build Vertical Slices

Do not build "the entire admin dashboard." Build:

1. Schema migration for one table
2. Service function for one status transition
3. One admin page that uses it
4. One email notification
5. Manual test checklist

### Avoid Huge AI Dumps

- Prompt Cursor with a single workflow (e.g., "approve furniture item")
- Review generated SQL and permission checks
- Reject generated code that bypasses `services/` layer

### Commit Frequently

- One slice per commit: `feat(admin): approve furniture item workflow`

### Migrations Always

- Schema change = migration file in same PR
- Never rely on Supabase UI alone for production schema

### Test Each Workflow

Manual MVP checklist per workflow:

- [ ] Form submits successfully
- [ ] Record appears in admin queue
- [ ] Status transition works
- [ ] Audit log row created
- [ ] Unauthorized user blocked from `/admin`
- [ ] PII not visible in wrong context

### Stay Aligned with Docs

If implementation diverges from [Workflows](workflows.md) statuses, update docs in the same PR or file a deliberate amendment.

---

## 15. MVP Build Sequence

Recommended implementation order:

| Step | Deliverable | Depends On |
|------|-------------|------------|
| **1. Project setup** | Next.js + Tailwind + shadcn + Drizzle + Supabase clients | — |
| **2. Database connection** | Schema: users, roles, user_roles, donor_profiles, partner_orgs | Step 1 |
| **3. Auth / admin access** | Login, admin layout, `requireAdmin()` | Step 2 |
| **4. Donor intake form** | Public `/donate`, photos, `furniture_items` insert | Step 2 |
| **5. Recipient request form** | Public `/refer`, partner code validation | Step 2 |
| **6. Admin dashboard** | Pipeline counts: submitted items, open requests | Steps 3–5 |
| **7. Item approval workflow** | Queue, approve/reject, email | Step 6 |
| **8. Request approval workflow** | Queue, verify, queue for matching | Step 6 |
| **9. Manual matching workflow** | Create match, reserve item, update need line | Steps 7–8 |
| **10. Transfer status workflow** | Schedule pickup, mark complete, cascade statuses | Step 9 |
| **11. Basic notifications** | Resend templates for key events | Steps 7–10 |
| **12. Reporting view** | Simple admin stats: transfers this month, median days | Step 10 |

**Defer until after step 12:** match scoring, dashboards, maps, volunteers, partner login, AI.

---

## 16. Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Overengineering** | Slow launch, wasted build | MVP stack doc; vertical slices; no microservices |
| **Privacy leaks** | Legal/reputational harm | DTO mappers, RLS, audit address views, security review before launch |
| **Cost creep** | Nonprofit budget strain | Defer maps/SMS; monitor Supabase/Vercel dashboards; set API budgets |
| **Map API costs** | Surprise bills at scale | Zip matching first; cache geocodes; Mapbox budget alerts |
| **Volunteer complexity** | Scope explosion | Manual assignment in MVP; portal in Phase 5 only |
| **Role complexity** | Auth bugs, wrong data exposure | MVP = admin only; add roles one phase at a time |
| **Storage drift** | Mission creep to warehouse model | No `warehouse_location_id`; storage_exception workflow only in Phase 2+ |
| **AI features too early** | Distraction, wrong auto-decisions | Phase 7 only; human approval permanent |
| **Supabase vendor lock-in** | Migration cost later | Drizzle + standard Postgres; portable schema |
| **Public form abuse** | Spam, junk items | Turnstile, rate limits, admin review gate |
| **Coordinator bottleneck** | Single admin role overload | Design for fast queues; batch actions in Phase 2 |

---

## 17. Open Technical Decisions

Founder and tech lead review required:

| # | Question | Current Recommendation |
|---|----------|------------------------|
| 1 | **Supabase Auth vs Clerk?** | Supabase Auth for MVP (one vendor with DB + RLS) |
| 2 | **Supabase Storage vs Cloudinary?** | Supabase Storage for MVP simplicity |
| 3 | **Mapbox vs Google Maps vs Nominatim?** | Zip only in MVP; Mapbox in Phase 6 if budget allows; Nominatim for dev |
| 4 | **Partner-only requests vs public recipient intake?** | Partner-primary; optional public request with `pending_verification` |
| 5 | **Exact address collection timing?** | Coordinator collects at approval or schedule—not required on public donate form |
| 6 | **When to enable donor/recipient logins?** | Phase 3 after 50+ manual transfers prove workflow |
| 7 | **PostgreSQL immediately vs Airtable prototype?** | PostgreSQL immediately—schema already designed; Airtable migration is throwaway work |
| 8 | **Drizzle vs Prisma?** | Drizzle—lighter, SQL-transparent; either works with Supabase |
| 9 | **Inngest vs Supabase Edge Functions for jobs?** | Inngest when background jobs matter (Phase 2+); sync email in MVP |
| 10 | **RLS in MVP or app-only checks?** | App-only for MVP admin-only; add RLS when multi-role dashboards ship |
| 11 | **Encrypt address columns at app layer?** | Defer; Supabase disk encryption + access control first |
| 12 | **Single Supabase project vs per-environment?** | Separate projects for dev, staging, production |

---

## Document Governance

- Update when stack choices change or new phases begin
- Cross-check with [Database Design](database-design.md) on schema changes
- Cross-check with [User Types](user-types.md) on auth/permission changes
- Evaluate new tools against Constitution Article X guardrails (direct transfer, minimal storage)

---

*Build coordination software, not warehouse software.*
