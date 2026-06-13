# Sleepwell Platform Roadmap

**Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Master Planning Document

---

## Executive Summary

Sleepwell is a technology-enabled nonprofit platform that coordinates furniture donations, volunteer labor, transportation, and community partnerships to help individuals and families transitioning into stable housing furnish their homes—without operating as a traditional furniture warehouse.

The guiding principle:

> *Whenever possible, resources move directly from donor to recipient, minimizing storage costs and maximizing community engagement.*

This roadmap defines an eight-phase path from concept validation through national-scale resource coordination. Each phase builds on the last, with explicit success criteria, risks, and dependencies to keep the organization aligned with its mission and operating model.

---

## Guiding Principles

| Principle | What It Means in Practice |
|-----------|---------------------------|
| Direct transfer first | Match donor and recipient before considering any storage step |
| Proximity over inventory | Geographic closeness is the primary matching signal |
| Volunteers as infrastructure | Labor and transport come from the community, not paid staff |
| Partners as force multipliers | Case managers and organizations validate need and close the loop |
| Data over intuition | Every match, delivery, and failure is logged and analyzed |
| Storage is an exception | Warehouse use requires explicit justification and time limits |

---

## Phase 1: Foundation & Validation

### Objectives

- Validate that direct donor-to-recipient coordination works in a single metro area
- Establish legal, operational, and brand foundations
- Prove demand from recipients, supply from donors, and referral flow from partners
- Build the minimum viable data model and manual workflows

### Features

- Landing page with mission, how-it-works, and intake forms
- Manual donation intake (form + phone/email follow-up)
- Manual recipient request intake with partner referral codes
- Spreadsheet or lightweight CRM for tracking requests, offers, and matches
- Basic item taxonomy (bed, dresser, table, couch, etc.)
- Photo collection workflow for donated items
- Simple status tracking: requested → matched → scheduled → delivered → confirmed
- Admin console (spreadsheet or Airtable/Notion) for coordinators
- Liability waiver and donation acceptance templates
- Pilot geography definition (one city or county)

### User Stories

| Role | Story |
|------|-------|
| Donor | As a donor, I can submit furniture I want to give away so someone nearby can receive it without it going to a warehouse. |
| Recipient | As a recipient, I can request essential furniture through my case manager so I can furnish my new home quickly. |
| Partner | As a case manager, I can refer a client and track whether their request was fulfilled. |
| Admin | As a coordinator, I can see all open requests and available donations in one place to make manual matches. |
| Volunteer | As a volunteer, I can sign up to help with a specific delivery when a match is made. |

### Success Criteria

- 50+ successful direct transfers completed without warehouse storage
- Median time from request to delivery under 14 days
- At least 3 active community partners submitting referrals
- At least 20 unique donors contributing items
- Storage used in fewer than 10% of matches
- Coordinator can process a new request in under 15 minutes

### Risks

| Risk | Mitigation |
|------|------------|
| Low donor supply in pilot area | Partner with churches, Buy Nothing groups, and estate sale companies |
| Recipients can't receive large items (no truck, no help) | Recruit volunteer drivers early; document transport as core need |
| Legal/liability concerns around donated goods | Consult nonprofit counsel; standardize waivers and "as-is" acceptance |
| Manual process doesn't scale | Time every workflow step; build software only for proven bottlenecks |
| Mission drift toward warehouse model | Enforce "direct first" rule in every operational decision |

### Dependencies

- 501(c)(3) status or fiscal sponsorship
- At least one full-time or dedicated part-time coordinator
- Initial partner relationships (rehab, re-entry, sober living)
- Basic brand identity and communication channels

---

## Phase 2: Matching Engine

### Objectives

- Replace manual matching with a rules-based engine that prioritizes proximity and item fit
- Reduce coordinator time per match by 50%
- Introduce structured data capture that feeds future intelligence

### Features

- Item catalog with attributes: type, dimensions, condition, photos, pickup constraints
- Recipient need profiles: required items, room constraints, access notes (stairs, elevator)
- Rule-based matching algorithm:
  - Geographic proximity (zip or radius)
  - Item type and condition match
  - Donor availability window
  - Recipient move-in date urgency
- Match scoring and ranked suggestions for coordinators
- Match lifecycle states with automated notifications
- Conflict resolution when multiple recipients match one item
- Audit log of match decisions (accepted, rejected, overridden)
- Email/SMS notification templates for match events

### User Stories

| Role | Story |
|------|-------|
| Admin | As a coordinator, I see ranked match suggestions so I can approve the best donor-recipient pair in minutes. |
| Donor | As a donor, I receive a notification when my item is matched and can confirm pickup timing. |
| Recipient | As a recipient, I am notified when furniture is found for my request and can confirm I can receive it. |
| Admin | As a coordinator, I can override a match and document why for future learning. |

### Success Criteria

- 80% of matches initiated from engine suggestions (not fully manual search)
- Coordinator time per match under 10 minutes
- Match acceptance rate above 70% (donor and recipient both confirm)
- Zero matches lost due to system errors or missed notifications
- Complete audit trail for 100% of matches

### Risks

| Risk | Mitigation |
|------|------------|
| Algorithm suggests poor matches | Keep human approval in the loop; log overrides to tune rules |
| Incomplete item data leads to bad matches | Require photos and dimensions for high-value items |
| Notification fatigue | Batch updates; let users set communication preferences |
| Edge cases (partial sets, mismatched conditions) | Define explicit fallback rules and escalation paths |

### Dependencies

- Phase 1 data model validated and populated with real records
- Defined item taxonomy and condition standards
- Notification infrastructure (email at minimum)
- Coordinator training on match approval workflow

---

## Phase 3: User Accounts & Dashboards

### Objectives

- Give each user type a self-service portal that reduces coordinator load
- Enable donors and volunteers to manage their own availability and commitments
- Provide recipients visibility into request status without calling staff

### Features

- Authentication (email magic link or OAuth)
- Role-based access: donor, recipient, volunteer, partner, admin
- **Donor dashboard:** active listings, match history, availability calendar, impact summary
- **Recipient dashboard:** open requests, matched items, delivery schedule, confirmation actions
- **Volunteer dashboard:** open delivery tasks, sign-up, completed history, hours tracking
- **Admin dashboard:** pipeline view, exceptions queue, user management, basic reporting
- Profile management: contact info, address, vehicle capacity (volunteers), referral source (recipients)
- In-app messaging or threaded comments per match
- Mobile-responsive design for field use

### User Stories

| Role | Story |
|------|-------|
| Donor | As a donor, I can log in and see all my active donations and past impact without emailing staff. |
| Recipient | As a recipient, I can check my request status and confirm delivery windows from my phone. |
| Volunteer | As a volunteer, I can browse open deliveries near me and claim one that fits my schedule. |
| Admin | As a coordinator, I can see a real-time pipeline of all requests, matches, and deliveries. |
| Partner | As a case manager, I can see the status of every referral I've submitted. |

### Success Criteria

- 60% of donors and recipients use self-service for status checks (vs. phone/email)
- 40% of delivery tasks claimed by volunteers through the portal
- Coordinator inbound inquiries reduced by 30%
- User registration completion rate above 80%
- Dashboard load time under 2 seconds on mobile

### Risks

| Risk | Mitigation |
|------|------------|
| Low adoption among recipients (digital divide) | Keep phone/coordinator path; partners can act on behalf of clients |
| Account sprawl and duplicate profiles | Email verification; partner-initiated accounts for recipients |
| Security and PII exposure | Role-scoped data access; encrypt addresses; audit access logs |
| Feature creep in dashboards | Ship role-specific MVPs; iterate from usage data |

### Dependencies

- Phase 2 matching engine stable and in production
- Authentication provider selected and integrated
- Privacy policy and terms of service published
- UX wireframes validated with at least one user per role

---

## Phase 4: Geographic Intelligence & Mapping

### Objectives

- Make proximity the primary, automated matching signal
- Visualize supply, demand, and volunteer capacity on a map
- Reduce failed deliveries caused by distance, access, or routing issues

### Features

- Geocoded addresses for donors, recipients, volunteers, and partners (with privacy controls)
- Map view: open donations, open requests, active deliveries, volunteer coverage
- Radius-based matching with configurable thresholds per item type
- Drive-time estimates (not just straight-line distance)
- Delivery route suggestions for volunteers with multiple stops
- Heatmaps: unmet demand, donor density, volunteer gaps
- Service area boundaries and expansion planning tools
- Address validation and standardized formatting
- Fuzzy location option for donors who prefer approximate pickup points

### User Stories

| Role | Story |
|------|-------|
| Admin | As a coordinator, I see a map of unmet requests and nearby donations to spot matching opportunities instantly. |
| Volunteer | As a volunteer, I see deliveries near me on a map and estimated drive time before I commit. |
| Admin | As a director, I see heatmaps of demand to decide where to recruit donors and partners. |
| Donor | As a donor, I can offer items with a general area instead of my exact address until a match is confirmed. |

### Success Criteria

- 90% of matches occur within 15-mile radius (configurable per market)
- Failed deliveries due to distance/access drop by 25%
- Median drive time for volunteers under 30 minutes
- Map-based match discovery used in 50% of coordinator sessions
- Geocoding accuracy above 95%

### Risks

| Risk | Mitigation |
|------|------------|
| Privacy concerns with exact addresses | Reveal full addresses only after match confirmation |
| Geocoding errors in rural areas | Manual override; partner-confirmed addresses |
| Map API costs at scale | Cache geocodes; batch routing; set usage budgets |
| Over-reliance on distance vs. item fit | Keep composite match score; distance is one weighted factor |

### Dependencies

- Phase 3 user accounts with address fields populated
- Mapping provider selected (Mapbox, Google Maps, or open-source stack)
- Privacy review for location data handling
- Sufficient address data from Phase 1–3 operations

---

## Phase 5: Volunteer Network

### Objectives

- Build a reliable, schedulable volunteer corps for delivery and moving
- Treat volunteers as core infrastructure, not an afterthought
- Track skills, availability, and reliability to improve match quality

### Features

- Volunteer profiles: vehicle type, capacity, lift ability, tools, assembly skills
- Availability calendar with recurring slots
- Task types: pickup only, delivery only, full move, assembly
- Task claiming, assignment, and release workflow
- Crew formation: pair volunteers for heavy items
- Reliability scoring based on completion and punctuality
- Volunteer onboarding: orientation content, safety checklist, waiver
- Hours tracking and export for volunteer recognition / reporting
- SMS reminders and day-of coordination messages
- "Urgent delivery" broadcast to nearby available volunteers
- Integration with corporate volunteer programs

### User Stories

| Role | Story |
|------|-------|
| Volunteer | As a volunteer, I set my availability and skills so I only see tasks I can actually do. |
| Volunteer | As a volunteer with a truck, I get notified of nearby pickups that need my vehicle. |
| Admin | As a coordinator, I assign a two-person crew for a heavy couch delivery. |
| Volunteer | As a volunteer, I receive a reminder the day before and a confirmation when the recipient is ready. |
| Admin | As a director, I report total volunteer hours and deliveries completed per quarter. |

### Success Criteria

- 70% of deliveries fulfilled by platform volunteers (vs. donor self-delivery or paid movers)
- Volunteer no-show rate under 5%
- Average time from match to scheduled delivery under 5 days
- Active volunteer pool of 50+ in pilot market
- Volunteer retention: 50% complete more than one task

### Risks

| Risk | Mitigation |
|------|------------|
| Volunteer burnout or churn | Limit task frequency; celebrate impact; flexible scheduling |
| Safety incidents during moves | Require orientation; two-person rule for heavy items; insurance review |
| Insufficient volunteers for peak demand | Partner with churches, corporate programs, and mover volunteers |
| Last-minute cancellations | Backup volunteer pool; escalation to coordinator |

### Dependencies

- Phase 3 volunteer dashboard
- Phase 4 geographic routing for task assignment
- Liability and insurance framework for volunteer activities
- Coordinator workflow for exception handling

---

## Phase 6: Partner Portal

### Objectives

- Make community partners the primary channel for recipient intake and outcome verification
- Reduce unauthorized or duplicate requests
- Give partners visibility and accountability without heavy coordinator involvement

### Features

- Partner organization accounts with multiple staff users
- Referral workflow: partner submits client request with case notes
- Client eligibility flags: move-in date, housing type, item restrictions
- Partner dashboard: all referrals, status, delivery confirmations
- Bulk referral import (CSV) for high-volume partners
- Partner-specific reporting: fulfillment rate, average time-to-delivery
- Approval workflow: partner-referred requests fast-tracked or flagged for review
- Outcome capture: partner confirms client stability post-delivery (30/60/90 day)
- Resource library for partners: how to refer, what items are available, FAQ
- API hooks for partner case management systems (future)

### User Stories

| Role | Story |
|------|-------|
| Partner | As a case manager, I submit a furniture request for my client in under 5 minutes. |
| Partner | As a program director, I see fulfillment rates for all referrals my organization has made. |
| Admin | As a coordinator, I trust partner-referred requests and spend less time verifying need. |
| Partner | As a social worker, I confirm my client received items and note any issues. |
| Admin | As a director, I identify which partner organizations drive the most successful outcomes. |

### Success Criteria

- 80% of recipient requests originate from partner referrals
- Partner-submitted requests processed 2x faster than walk-in requests
- Partner fulfillment visibility: 100% can see status without contacting staff
- At least 10 active partner organizations in pilot market
- Outcome data collected for 50% of completed deliveries

### Risks

| Risk | Mitigation |
|------|------------|
| Partner bureaucracy slows intake | Streamline form; allow batch submissions |
| Partners refer ineligible clients | Clear eligibility guidelines; audit sample of referrals |
| Unequal partner access (rural vs. urban) | Outreach program; phone-assisted intake for low-tech partners |
| Data sharing restrictions | BAA-style agreements where needed; minimum necessary data |

### Dependencies

- Phase 3 authentication and role-based access
- Phase 5 delivery confirmation workflow
- Signed partner agreements and referral protocols
- Coordinator training on partner tier policies

---

## Phase 7: Automation & AI

### Objectives

- Automate repetitive coordination tasks that coordinators still perform manually
- Use machine learning to improve match quality and predict demand
- Introduce intelligent assistants without removing human judgment from high-stakes decisions

### Features

- **Auto-match mode:** high-confidence matches auto-approved within defined guardrails
- **Photo intelligence:** classify furniture type and estimate condition from donor photos
- **Demand forecasting:** predict item needs by geography and season
- **Donor outreach automation:** re-engage lapsed donors; suggest items based on open requests
- **Smart notifications:** optimal timing and channel per user behavior
- **Chatbot / intake assistant:** guide donors and partners through submission
- **Anomaly detection:** flag suspicious requests, duplicate accounts, or no-show patterns
- **Coordinator copilot:** natural-language queries over operational data ("show unmet bed requests in East County")
- **Document generation:** auto-generate delivery receipts, tax acknowledgment letters
- **Feedback loops:** match outcome data trains ranking models

### User Stories

| Role | Story |
|------|-------|
| Admin | As a coordinator, high-confidence matches are auto-scheduled so I focus on exceptions. |
| Donor | As a donor, I upload a photo and the system suggests item type and condition for my listing. |
| Admin | As a director, I see a forecast of bed demand next month to plan donor outreach. |
| Partner | As a case manager, I use a chat assistant to submit a request without learning the full form. |
| Admin | As a coordinator, I ask the system in plain English which deliveries are at risk of missing their window. |

### Success Criteria

- 40% of matches auto-approved without human intervention (within guardrails)
- Photo classification accuracy above 85% for primary item types
- Coordinator hours per delivery reduced by 50% from Phase 5 baseline
- Demand forecast within 20% of actual for top 5 item categories
- Zero auto-match incidents requiring emergency correction

### Risks

| Risk | Mitigation |
|------|------------|
| Auto-match sends wrong item to wrong person | Strict guardrails; human review for edge cases; easy rollback |
| AI bias in recipient prioritization | Auditable rules; diverse training data; human override always available |
| Over-automation erodes community feel | Keep personal touchpoints for first-time donors and recipients |
| AI costs exceed nonprofit budget | Start with rule-based automation; add ML incrementally |
| Staff deskilling | Position AI as copilot; train coordinators on exception handling |

### Dependencies

- Phases 2–6 producing structured, labeled operational data (minimum 500+ completed deliveries)
- Data pipeline and analytics infrastructure
- AI/ML governance policy (privacy, fairness, transparency)
- Budget for inference and third-party AI services

---

## Phase 8: Scale & Expansion

### Objectives

- Replicate the proven model in new geographic markets
- Expand beyond furniture to additional resource types
- Establish Sleepwell as a platform other nonprofits can adopt or affiliate with

### Features

- Multi-tenant architecture: market-level configuration (service areas, partners, rules)
- Market launch playbook: partner recruitment, donor seeding, volunteer drives
- Resource type expansion: appliances, household goods, moving supplies
- Cross-market analytics and benchmarking
- Franchise / affiliate model for other cities
- Public API for third-party integrations
- White-label option for partner organizations
- National partner network directory
- Advanced reporting: cost-per-delivery, storage ratio, volunteer leverage, outcome correlation
- Sustainability model: grants, corporate sponsorships, optional donor tips, partner fees

### User Stories

| Role | Story |
|------|-------|
| Admin | As a regional director, I launch a new city with pre-configured workflows and local branding. |
| Donor | As a donor, I can offer appliances and household goods, not just furniture. |
| Partner | As a national re-entry organization, I refer clients in any city where Sleepwell operates. |
| Admin | As an executive, I compare cost-per-delivery across markets to allocate resources. |
| Volunteer | As a volunteer, I join a local chapter and see only tasks in my market. |

### Success Criteria

- 3+ markets operating with positive unit economics (cost per delivery declining)
- Storage used in fewer than 5% of transfers across all markets
- Resource type expansion contributes 20% of total matches
- Partner NPS above 50
- Platform uptime 99.5%

### Risks

| Risk | Mitigation |
|------|------------|
| Quality drops during rapid expansion | Market readiness checklist; minimum volunteer and partner thresholds before launch |
| Mission drift toward warehousing at scale | Storage ratio as board-level KPI; auto-alerts when ratio exceeds threshold |
| Funding gaps between markets | Phase market launches; secure local anchor funding per region |
| Technology complexity | Multi-tenant from Phase 8 only; earlier phases stay single-market |
| Brand dilution in affiliate model | Core standards agreement; shared technology stack |

### Dependencies

- Phases 1–7 proven in at least one market with 12+ months of data
- Multi-tenant technical architecture
- Expansion funding secured per market
- Legal framework for affiliate / licensing model

---

## MVP Definition

The MVP is the smallest set of capabilities that allows Sleepwell to complete real donor-to-recipient furniture transfers in one pilot market with coordinator oversight. Nothing in the MVP requires a warehouse.

### Must Have (Before Launch)

| Category | Requirement |
|----------|-------------|
| Intake | Public website with donation and request forms |
| Items | Defined taxonomy with photo upload |
| Matching | Coordinator tool to view open requests and donations and create matches |
| Notifications | Email notifications for match, schedule, and confirmation events |
| Delivery | Delivery scheduling with donor self-delivery or volunteer assignment |
| Confirmation | Recipient and donor confirm completion |
| Partners | At least one partner referral path (form field or separate partner form) |
| Legal | Liability waivers, privacy policy, donation receipt template |
| Data | Structured storage of users, items, requests, matches, and deliveries |
| Reporting | Basic dashboard: open requests, completed deliveries, average time-to-delivery |

### Should Have (Within 90 Days of Launch)

- SMS notifications
- Volunteer sign-up and task claiming
- Simple proximity filter (zip code or city)
- Partner status visibility
- Mobile-responsive forms

### Explicitly Out of Scope for MVP

- Automated matching without human approval
- Map visualization
- AI/photo classification
- Multi-market support
- Warehouse inventory management
- Payment processing
- Native mobile apps
- Public API

### MVP Launch Checklist

- [ ] 3+ partner organizations committed to referring clients
- [ ] 10+ donors with items listed or pledged
- [ ] 5+ volunteers registered for delivery
- [ ] Coordinator trained on end-to-end workflow
- [ ] 10 test matches completed successfully in dry run
- [ ] Legal review of waivers and data handling complete
- [ ] Support channel defined (email + phone hours)

---

## Technical Architecture Recommendations

### Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js (React) + TypeScript | SEO-friendly marketing site; shared codebase for dashboards; strong ecosystem |
| UI | Tailwind CSS + shadcn/ui | Fast iteration; accessible components; low design overhead |
| Backend | Next.js API routes or separate Node.js service | Start monolithic; extract services when scaling |
| Database | PostgreSQL (via Supabase or Neon) | Relational model fits matching workflows; JSON fields for flexibility; strong geo extensions |
| Auth | Clerk, Auth0, or Supabase Auth | Role-based access; magic links for low-friction recipient onboarding |
| File Storage | S3-compatible (Cloudflare R2, AWS S3) | Donor photos; document storage; low cost |
| Maps | Mapbox or Google Maps Platform | Geocoding, drive-time, map visualization |
| Notifications | Resend (email) + Twilio (SMS) | Reliable delivery; template management |
| Background Jobs | Inngest, BullMQ, or Supabase Edge Functions | Match notifications; scheduled reminders; async processing |
| Analytics | PostHog or Plausible | Privacy-respecting usage analytics |
| Hosting | Vercel (frontend) + managed Postgres | Low ops burden for small team; scales with traffic |

### Architecture Principles

1. **Monolith first.** A single deployable application until Phase 7 complexity demands service extraction.
2. **API-ready.** Internal modules exposed through clear interfaces so a public API (Phase 8) is a packaging exercise, not a rewrite.
3. **Event-driven matching.** Every state change (new donation, new request, match approved) emits an event that triggers notifications and analytics.
4. **Privacy by design.** Addresses, case notes, and partner referrals are encrypted at rest and scoped by role.
5. **Offline-tolerant field workflows.** Volunteers and coordinators must complete key actions on mobile with spotty connectivity.

### Infrastructure Phases

| Phase | Infrastructure Milestone |
|-------|--------------------------|
| 1 | Static site + form backend + spreadsheet sync or Airtable |
| 2 | PostgreSQL + matching service + email notifications |
| 3 | Auth + role-based dashboards |
| 4 | Geocoding pipeline + map tiles |
| 5 | Task queue for volunteer scheduling + SMS |
| 6 | Partner multi-user accounts + reporting views |
| 7 | Analytics warehouse + ML inference endpoints |
| 8 | Multi-tenant config + public API gateway |

---

## Database Growth Strategy

The data model should evolve in layers, adding entities only when operational reality demands them.

### Core Entities (Phase 1–2)

```
users
organizations (partners)
donations (items offered)
requests (items needed)
matches
deliveries
```

### Phase 3–4 Additions

```
user_roles
user_profiles (extended attributes per role)
addresses (geocoded, privacy-scoped)
availability_windows
match_audit_log
```

### Phase 5–6 Additions

```
volunteer_profiles (skills, vehicle, capacity)
volunteer_tasks
task_assignments
partner_referrals
outcome_surveys
```

### Phase 7–8 Additions

```
match_scores (ML features and outcomes)
demand_forecasts
market_configurations
resource_types (beyond furniture)
api_keys
affiliate_organizations
```

### Schema Principles

| Principle | Implementation |
|-----------|----------------|
| Normalize people and organizations | One `users` table with role extensions, not duplicate tables per role |
| Soft-delete and audit everything | `deleted_at`, `created_by`, `updated_by` on all transactional tables |
| Match is the central transaction | Donations and requests link through `matches`; deliveries hang off matches |
| Geography as first-class data | Separate `addresses` table with geocode cache; never duplicate raw addresses |
| Extensible item attributes | JSONB `attributes` column on donations and requests for type-specific fields |
| Partition by market (Phase 8) | `market_id` on all operational tables for multi-tenant isolation |

### Migration Strategy

- Use versioned SQL migrations (Prisma Migrate, Drizzle, or Flyway)
- Never break existing queries; add columns and backfill
- Archive completed deliveries older than 2 years to cold storage
- Maintain a reporting replica to isolate analytics from transactional load

---

## Key Metrics

### Mission Metrics (Board-Level)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Direct transfer rate | > 90% | Measures adherence to core mission (non-warehouse model) |
| Storage utilization rate | < 10% | Early warning of mission drift |
| Time to delivery (median) | < 10 days | Recipient experience and housing stability impact |
| Request fulfillment rate | > 75% | Are we meeting actual need? |
| Partner referral share | > 80% | Validates partner-channel strategy |

### Operational Metrics (Weekly)

| Metric | Target |
|--------|--------|
| Open requests aging > 14 days | < 15% of queue |
| Match acceptance rate | > 70% |
| Delivery completion rate (scheduled → done) | > 90% |
| Volunteer fulfillment rate | > 70% of deliveries |
| Coordinator hours per delivery | Declining quarter over quarter |

### Growth Metrics (Monthly)

| Metric | Target |
|--------|--------|
| New donors | Growing 10% month over month (pilot phase) |
| Active volunteers (completed task in 90 days) | Growing |
| Active partner organizations | Growing |
| Repeat donor rate | > 30% |
| Cost per delivery | Declining toward sustainability threshold |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Recipient satisfaction (post-delivery survey) | > 4.0 / 5.0 |
| Donor satisfaction | > 4.0 / 5.0 |
| Volunteer no-show rate | < 5% |
| Item condition disputes | < 3% |
| Data completeness (photos, dimensions, address) | > 85% |

### Platform Health (Engineering)

| Metric | Target |
|--------|--------|
| Uptime | > 99.5% |
| Notification delivery rate | > 98% |
| P95 page load (mobile) | < 3 seconds |
| Auto-match error rate (Phase 7+) | < 0.5% |

---

## Operational Principles

These rules prevent Sleepwell from becoming an expensive warehouse operation.

### 1. Direct Transfer Default

Every item enters the system with the assumption it moves directly from donor to recipient. Storage is never the default next step.

### 2. Storage Requires Justification

If an item must be stored, the coordinator documents:

- Why direct transfer failed
- Expected storage duration (hard cap: 30 days)
- Storage cost attribution
- Re-match plan

Items in storage longer than 30 days trigger an escalation review.

### 3. No Inventory Hoarding

Sleepwell does not accept donations without a matched or matchable recipient, except during documented seasonal campaigns with exit plans.

### 4. Proximity Before Perfection

A good match nearby is better than a perfect match far away. Distance increases cost, failure rate, and volunteer burden.

### 5. Volunteers Before Paid Movers

Paid moving services require approval and are tracked as exceptions. Volunteer fulfillment rate is a standing agenda item.

### 6. Partners Gate Recipient Intake

Walk-in requests are accepted but deprioritized. Partner-referred clients have verified need and housing stability timeline.

### 7. Data Before Expansion

A new market does not launch until the current market hits fulfillment rate, volunteer coverage, and cost-per-delivery thresholds.

### 8. Coordinator Time Is Precious

Any workflow that takes a coordinator more than 15 minutes per transaction gets flagged for automation or redesign.

### 9. Measure Storage Ratio Monthly

The storage ratio (items stored ÷ total items matched) is reported to leadership monthly. Trending upward triggers an operational review.

### 10. Community Over Convenience

Features that reduce community engagement (e.g., anonymous drop-off warehouses) are rejected unless they serve a documented accessibility need.

---

## Long-Term Vision (3–5 Years)

If executed successfully, Sleepwell evolves from a furniture coordination nonprofit in one city into a **community resource matching network** that helps people transitioning into stable housing access everything they need to build a home and a life.

### Year 1: Prove the Model

- One market operating with 200+ deliveries
- Direct transfer rate above 90%
- 10+ partner organizations
- Coordinator-to-delivery ratio sustainable on grants and volunteer labor

### Year 2: Optimize and Expand

- Matching engine and volunteer network mature
- Second market launched using playbook
- Appliance and household goods added
- Outcome data links furniture delivery to housing retention metrics

### Year 3: Platform Emergence

- 5+ markets operating
- Partner portal is the primary intake channel nationally
- AI-assisted matching and demand forecasting reduce coordinator headcount per delivery by 60%
- Other nonprofits begin adopting Sleepwell technology under affiliate agreements

### Year 4–5: Resource Coordination Network

Sleepwell becomes a **platform for transitional resource matching**, not just furniture:

| Resource Category | Coordination Model |
|-------------------|-------------------|
| Furniture & household goods | Direct donor-to-recipient (core) |
| Appliances | Retailer and manufacturer partnerships |
| Transportation | Volunteer network + partner fleet |
| Mentorship | Partner organization volunteer matching |
| Employment support | Referral to workforce partners via partner portal |
| Community services | Directory with warm handoff through case managers |

### What Success Looks Like

- A family moving into stable housing receives essential furnishings within one week, at near-zero storage cost, through a network of local donors and volunteers.
- Case managers spend 5 minutes referring a client and receive automatic status updates until delivery is confirmed.
- Sleepwell operates at a fraction of the cost per client served compared to traditional furniture banks.
- The platform's matching intelligence is open-sourced or licensed to other nonprofits addressing resource gaps in their communities.
- Storage facilities, where they exist, are small, temporary, and viewed as a failure of coordination—not a core asset.

### What Sleepwell Is Not

- A furniture warehouse with a website
- A for-profit marketplace
- A replacement for housing programs or social services
- A data broker selling recipient information

Sleepwell is the **coordination layer**—the connective tissue between community generosity, volunteer energy, and the people who need it most.

---

## Appendix: Phase Timeline Overview

```
Phase 1  Foundation & Validation          Months 1–4
Phase 2  Matching Engine                  Months 4–7
Phase 3  User Accounts & Dashboards     Months 7–10
Phase 4  Geographic Intelligence          Months 10–13
Phase 5  Volunteer Network                Months 12–16
Phase 6  Partner Portal                   Months 15–18
Phase 7  Automation & AI                  Months 18–24
Phase 8  Scale & Expansion                Months 24–36+
```

Phases overlap intentionally. Geographic intelligence (Phase 4) can begin during Phase 3 dashboard work. Volunteer network (Phase 5) should start recruitment during Phase 1 even if tooling arrives later.

---

## Document Governance

| Action | Owner | Frequency |
|--------|-------|-----------|
| Review metrics against phase success criteria | Executive Director + Tech Lead | Monthly |
| Update roadmap based on learnings | Product / Program Lead | Quarterly |
| Board review of mission metrics | Board of Directors | Quarterly |
| Phase gate decision (proceed / pause / pivot) | Leadership team | At phase completion |

This document is the authoritative planning reference for Sleepwell. Changes require review by the leadership team and should be versioned in the project repository.
