# Sleepwell User Types & Permissions

**Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Master Permissions Reference

---

## About This Document

This document defines every user type in the Sleepwell platform: what each person can do, what they can see, what they cannot see, and how permissions evolve across roadmap phases.

Sleepwell is a nonprofit resource coordination network connecting furniture donors, recipients, volunteers, community partners, and administrators. The platform prioritizes **direct donor-to-recipient transfer** and **human approval for sensitive actions**.

**Related documents:**

- [Constitution](constitution.md) — mission, dignity, and operational guardrails
- [Roadmap](roadmap.md) — phased feature and portal rollout
- [Workflows](workflows.md) — operational processes each role participates in
- [Database Design](database-design.md) — `users`, `roles`, `user_roles`, and profile tables
- [Mission](mission.md) — (planned; inferred from Constitution Article I)
- [Operating Model](operating-model.md) — (planned)

---

## Design Principles

| Principle | Permission Implication |
|-----------|------------------------|
| **Dignity** | Recipients are not case files; partners see minimum necessary client data |
| **Direct transfer first** | Donors and recipients gain address access only when a match is approved and transfer is scheduled |
| **Human-in-the-loop** | Match approval, item approval, and storage exceptions require coordinator or administrator action |
| **Privacy by default** | Exact addresses, phones, and case notes are scoped by role and workflow stage |
| **Low-tech pathways** | Phone and partner-mediated intake always supported; not every actor needs a login |
| **Least privilege** | Roles receive the minimum access required for their workflow step |
| **Multiple roles** | One person may be donor and volunteer; permissions are additive with strictest privacy rule winning for PII |

---

## Role Hierarchy Overview

```
public_visitor          (no account)
    │
    ├── donor
    ├── recipient
    ├── volunteer
    ├── partner_user ─── partner_admin (org-scoped elevation)
    │
    ├── coordinator       (operational admin)
    ├── administrator     (system admin)
    └── board_viewer      (read-only oversight)
```

**Database mapping ([Database Design](database-design.md)):** MVP `roles` table includes `donor`, `recipient`, `volunteer`, `partner_user`, `admin`. Application-layer permission scopes distinguish `coordinator`, `administrator`, and `board_viewer` within or alongside `admin` until sub-roles are added to the schema.

---

## User Type Definitions

### Public Visitor

**Description:** Anyone browsing the Sleepwell website without an account. May learn about the mission, understand how to participate, and submit public intake forms that create records pending staff review.

**Primary goals:**
- Understand what Sleepwell does and how to help or get help
- Submit initial interest forms (donation, volunteer interest, partner inquiry)
- Contact the organization through public channels

**What they can submit:**
- Public donation interest form (creates pending donor submission)
- Public partner inquiry form
- Volunteer interest form (Phase 5+)
- General contact / newsletter signup

**What they can view:**
- Marketing pages, mission, how-it-works, FAQ
- Public impact stories (anonymized, consent-based only)
- General service area description (city/county level—not live inventory maps)

**What they can edit:**
- Nothing persisted to an account (no account exists)
- In-progress form fields during submission only

**What they cannot access:**
- Any donor, recipient, or partner dashboards
- Live furniture inventory or request queue
- Exact addresses, match details, or operational pipeline
- Admin console, reports, audit log, or exports

**Key workflows:**
- Workflow 1 (Donor Submission) — public form entry point
- Workflow 3 (Partner Referral) — partner inquiry only
- Workflow 7 (Volunteer Management) — interest capture (later phase)

**Privacy restrictions:**
- No PII from other users visible
- Submitted form data handled per privacy policy; not displayed back publicly

**Notification needs:**
- Optional confirmation email/SMS on form submission
- No operational notifications

**Dashboard needs:**
- None; static pages and forms only

| Access Level | Scope |
|--------------|-------|
| **MVP** | Marketing site, public donation form, public partner contact form, phone/email CTAs |
| **Future** | Volunteer interest form, interactive service area map (zip-level only), anonymized live impact counter |

---

### Donor

**Description:** An individual, family, business, or organization contributing furniture or other resources to the network. Donors hold items until direct transfer; they are not a supply chain input to a warehouse.

**Primary goals:**
- Submit furniture and household items easily
- Understand whether items are accepted and matched
- Complete direct transfer (pickup by recipient or volunteer) with minimal friction
- See the impact of their generosity

**What they can submit:**
- Furniture item listings (photos, category, condition, location area, availability)
- Updates to active listings (availability, withdrawal)
- Pickup availability windows
- Post-transfer confirmation
- Optional fair market value for tax documentation (future)

**What they can view:**
- Own profile and contact preferences
- Own submissions and status history
- Own match notifications and scheduling details for **their** items
- Recipient **area** (city/zip) after match approval—not full identity by default
- Pickup/delivery schedule for their matched items
- Own impact summary and thank-you messages
- Own tax receipts (future)

**What they can edit:**
- Own profile, contact info, communication preferences
- Own active listings (before `reserved` status)
- Availability windows for matched items
- Confirm or decline proposed match timing

**What they cannot access:**
- Other donors' listings or contact information
- Recipient full name, phone, or exact address until transfer protocol allows (often coordinator-mediated in MVP)
- Open recipient request queue or need details beyond their match
- Match scores, internal coordinator notes, or partner case notes
- Volunteer personal details beyond first name for scheduled delivery
- Admin pipeline, partner reports, audit log
- Bulk data export

**Key workflows:**
- Workflow 1 (Donor Submission)
- Workflow 5 (Direct Recipient Pickup) — donor as pickup location host
- Workflow 6 (Volunteer Delivery) — donor as item release point
- Workflow 9 (Donor Impact)

**Privacy restrictions:**
- Donor exact address shared with recipient/volunteer only after match approval and per `pickup_privacy_level`
- Donor may choose meet-point pickup; recipient never sees home address in that mode
- Impact reporting anonymous by default

**Notification needs:**
- Submission received and review outcome (approved / rejected / incomplete)
- Match proposed and match approved
- Pickup/delivery schedule requests and confirmations
- Reminder before scheduled transfer
- Thank-you and impact summary after completion

**Dashboard needs:**
- Active listings with status badges
- Match history
- Availability calendar (Phase 3+)
- Impact summary and receipts (Phase 4+)

| Access Level | Scope |
|--------------|-------|
| **MVP** | Public form or coordinator-created record; email/phone status updates; no self-service login required |
| **Future (Phase 3+)** | Full donor dashboard, login, in-app match confirmations, impact and tax receipt download |

---

### Recipient

**Description:** An individual or household transitioning into stable housing who needs essential furniture. Enters primarily through partner referral; may participate directly in match confirmation and transfer scheduling.

**Primary goals:**
- Obtain essential furniture with dignity and reasonable speed
- Understand request status without repeatedly calling staff
- Confirm matches and schedule pickup or delivery
- Communicate access constraints (stairs, move-in date, vehicle access)

**What they can submit:**
- Request for furniture needs (if direct intake enabled—usually partner-mediated)
- Confirmation of match acceptance or decline
- Availability for pickup/delivery
- Transfer completion confirmation
- Optional consent for impact story sharing

**What they can view:**
- Own profile (limited fields)
- Own request status and need line fulfillment progress
- Matched item details (category, photos, condition)—after match approval
- Donor **area** and pickup constraints—not donor identity or exact address until transfer scheduled per protocol
- Scheduled pickup/delivery details for own matches
- Coordinator contact information

**What they can edit:**
- Own contact info and communication preferences (Phase 3+)
- Availability windows
- Access notes (stairs, parking, move-in date updates)
- Match accept/decline responses

**What they cannot access:**
- Other recipients' requests or matches
- Full donor contact details before approved contact protocol
- Open donor inventory browse (recipients are matched, not shopping a catalog)
- Partner internal notes about other clients
- Match scores, queue position numbers, or internal priority rationale
- Volunteer home addresses or unrelated delivery tasks
- Admin tools, partner org management, reports

**Key workflows:**
- Workflow 2 (Recipient Request)
- Workflow 4 (Matching Engine) — confirm receipt capability
- Workflow 5 (Direct Recipient Pickup)
- Workflow 6 (Volunteer Delivery) — receive at housing location

**Privacy restrictions:**
- Housing address shared with assigned volunteer only for active delivery assignment
- Recipient identity not shared with donors beyond first name if direct contact consented
- Partner remains advocate; recipient not required to navigate bureaucracy alone

**Notification needs:**
- Request received and approval status
- Match found and match approved
- Schedule proposals and reminders
- Delivery/pickup day reminders
- Confirmation request after transfer

**Dashboard needs:**
- Request status tracker (essential items checklist)
- Matched items with photos
- Delivery/pickup schedule and confirmation actions
- Coordinator message thread (Phase 3+)

| Access Level | Scope |
|--------------|-------|
| **MVP** | Partner submits on behalf; recipient contacted by phone/SMS; no login required |
| **Future (Phase 3+)** | Recipient mobile dashboard; self-service status and confirmations |

---

### Volunteer

**Description:** Someone donating labor, vehicle access, delivery help, assembly, or time. Volunteers enable direct transfer at scale without defaulting to paid logistics.

**Primary goals:**
- Find delivery tasks that fit their skills, vehicle, and schedule
- Complete assignments safely with clear expectations
- Track service hours and history
- Contribute without unnecessary complexity

**What they can submit:**
- Volunteer registration and skill profile
- Availability windows
- Task claim / accept / decline
- Delivery completion reports and hours
- Incident or safety reports

**What they can view:**
- Own profile, skills, vehicle capacity, reliability summary (own record)
- Open delivery tasks **matching their capabilities** (Phase 5+)
- Assigned task details: item description, pickup address, delivery address, access notes, schedule
- Donor and recipient **first names** and **task-relevant phones** for active assignments only
- Own completed task history and hours logged

**What they can edit:**
- Own profile, skills, availability, waiver status
- Accept or decline offered tasks
- Update task status (en route, completed)
- Log hours and miles for assigned tasks

**What they cannot access:**
- Unassigned open tasks outside their qualification filters (until broadcast rules apply)
- Recipient or donor records unrelated to assigned task
- Full recipient case history or partner notes
- Match scoring, internal coordinator notes
- Donor inventory not attached to assigned task
- Partner dashboards, tax receipts, impact stories
- User management, match approval, or audit log
- Exact addresses of parties not involved in current assignment

**Key workflows:**
- Workflow 6 (Volunteer Delivery)
- Workflow 7 (Volunteer Management)
- Workflow 10 (Exception Management) — incident reporting

**Privacy restrictions:**
- Addresses visible only for **accepted, active** assignments
- Address access expires after task completion
- No browsing recipient profiles independently

**Notification needs:**
- New task matching skills nearby (opt-in)
- Assignment confirmation and schedule reminders
- Cancellation or reschedule alerts
- Thank-you and hours summary after completion

**Dashboard needs:**
- Open tasks near me (map optional Phase 4+)
- My claimed assignments with route details
- Completed history and hours
- Availability manager

| Access Level | Scope |
|--------------|-------|
| **MVP** | Coordinator assigns volunteer by phone; volunteer name in `transfers.notes`; no portal |
| **Future (Phase 5+)** | Full volunteer dashboard, task claim, hours tracking, reliability score visibility (own) |

---

### Partner User

**Description:** A case manager, social worker, sober living operator, rehab staff member, church contact, or re-entry program worker who refers clients and tracks referral outcomes. Force multiplier for verified intake.

**Primary goals:**
- Submit client referrals quickly with minimum necessary information
- Track whether referred clients' requests are fulfilled
- Support clients without chasing furniture logistics
- Communicate urgency and housing readiness accurately

**What they can submit:**
- Partner referrals and recipient requests on behalf of clients
- Client need lists, move-in dates, urgency flags, access notes
- Housing verification attestations
- Delivery confirmation or issue reports for referred clients
- Outcome check-ins (30/60/90 day—Phase 6+)

**What they can view:**
- Own partner organization profile (name, referral code, tier)
- Referrals **they submitted** or are assigned to (Phase 6 org-wide for Partner Admin)
- Referred clients' request status and need-line fulfillment (not other partners' clients)
- Matched item categories and transfer status for their clients
- City/zip and access notes for their clients
- Aggregate org fulfillment metrics (Phase 6+, if Partner Admin)

**What they can edit:**
- Draft referrals before submission
- Update open referrals (move-in date, needs, urgency) while request not fulfilled
- Add partner notes on active referrals (not visible to donors)
- Confirm housing verification for their clients

**What they cannot access:**
- Donor listings, donor contact info, or donor addresses
- Recipients not referred by their organization (unless explicitly shared)
- Match creation, match approval, or item approval
- Volunteer assignment or scheduling internals
- Other partner organizations' referrals or metrics
- Tax receipts, donor impact details identifying donors
- System configuration, user management, audit log
- Full admin pipeline across all organizations

**Key workflows:**
- Workflow 2 (Recipient Request) — partner-submitted path
- Workflow 3 (Partner Referral)
- Workflow 5/6 — informed of schedule, not operator
- Workflow 10 — escalate client issues

**Privacy restrictions:**
- Minimum necessary client PII on referral forms
- Cannot browse donor inventory or recipient queue globally
- Client phone/address visible for coordination of **their** active referrals only

**Notification needs:**
- Referral received and converted to request
- Request approved or returned for more info
- Match and schedule updates for their clients
- Fulfillment completion
- Client unresponsiveness alerts

**Dashboard needs:**
- My referrals list with status
- Client request detail view
- Simple fulfillment tracker per client
- Resource library / FAQ (Phase 6)

| Access Level | Scope |
|--------------|-------|
| **MVP** | Referral form with partner code; email status updates from coordinator; no login |
| **Future (Phase 6)** | Partner portal login, multi-referral tracking, org reporting for Partner Admins |

---

### Partner Admin

**Description:** A trusted leader within a partner organization—program director, executive director, or designated referral lead—who manages org staff access, sees org-wide metrics, and maintains referral quality.

**Primary goals:**
- Oversee all referrals from their organization
- Monitor fulfillment performance and referral quality
- Manage which staff members have partner portal access
- Ensure organizational accountability to Sleepwell agreements

**What they can submit:**
- Everything Partner User can submit
- Staff user invitations for their organization
- Organization profile updates (contact, service area)
- Bulk referral import (CSV—Phase 6+)
- Organizational outcome attestations

**What they can view:**
- Everything Partner User can view, **org-wide** (all referrals from their organization)
- Org fulfillment rate, average time-to-delivery, open vs. fulfilled counts
- Staff activity summary (referrals per user)
- Partner tier and referral quality score (own org)
- Aggregated issue/exception counts for org referrals (not full audit log)

**What they can edit:**
- Partner organization profile fields (within allowed set)
- Staff partner user access (invite, deactivate—not Sleepwell roles)
- Reassign referral ownership among org staff
- Org-level notification preferences

**What they cannot access:**
- Other partner organizations' data
- Sleepwell global pipeline across all partners
- Donor identities, addresses, or inventory
- Match approval, item approval, volunteer assignment
- Sleepwell internal coordinator notes on unrelated cases
- System administration, global exports, full audit log
- Board-level cross-org analytics (unless also Board Viewer)

**Key workflows:**
- Workflow 3 (Partner Referral) — oversight
- Workflow 3 partner reporting
- Partner onboarding (with Sleepwell Administrator)

**Privacy restrictions:**
- Org-scoped data isolation; row-level security by `partner_organization_id`
- Same client PII rules as Partner User; no donor PII

**Notification needs:**
- Weekly org fulfillment summary
- Referral quality or probation warnings from Sleepwell
- Critical failures affecting org clients

**Dashboard needs:**
- Org referral pipeline
- Fulfillment and time-to-delivery charts
- Staff referral activity
- Partner agreement and resource library

| Access Level | Scope |
|--------------|-------|
| **MVP** | Same as Partner User; director receives email reports manually from coordinator |
| **Future (Phase 6)** | Partner Admin portal with org dashboard and staff management |

---

### Sleepwell Coordinator

**Description:** Operational staff who run day-to-day coordination: review submissions, approve requests, create and approve matches, schedule transfers, assign volunteers, and handle exceptions. Makes judgment calls algorithms cannot.

**Primary goals:**
- Move resources from intake to confirmed transfer quickly and safely
- Protect recipient dignity and donor experience
- Keep direct-transfer path preferred over storage
- Resolve exceptions and scheduling failures

**What they can submit:**
- Reviews and status changes on items and requests
- Matches (manual MVP; approve engine suggestions Phase 2+)
- Transfer schedules and reschedule actions
- Volunteer assignments (Phase 5+)
- Communications log entries
- Exception / incident records
- Storage exception requests (approval may need Administrator)

**What they can view:**
- Full operational pipeline: open items, queued requests, pending matches, scheduled transfers
- All donor and recipient profiles **for active operational records**
- Exact addresses for items and requests involved in active matching/scheduling
- Partner referrals and partner org details
- Match scores and explanations (Phase 2+)
- Volunteer profiles and availability (Phase 5+)
- Communications history for cases they manage
- Exception queue

**What they can edit:**
- Item and request status (within coordinator authority)
- Match create/approve/reject/override
- Transfer schedule and notes
- Assign volunteers to deliveries
- Send templated notifications
- Create and update user records on behalf of low-tech participants (MVP)

**What they cannot access:**
- Grant or revoke Administrator or Board Viewer roles
- Change partner organization tier or terminate partnerships (Administrator)
- System configuration, API keys, integration settings
- Full financial / board reporting exports (unless granted)
- Delete audit log entries
- Bulk PII export without Administrator approval
- Approve storage exceptions beyond policy limits without Administrator escalation

**Key workflows:**
- All workflows except partner onboarding approval (shared with Administrator)
- Primary owner of Workflows 4, 5, 6, 8, 10 day-to-day

**Privacy restrictions:**
- Access only for operational need; address views logged in `audit_log`
- Must not share recipient/donor PII outside platform channels
- Impact stories require recipient consent before sharing with donors

**Notification needs:**
- New submissions and referrals queue
- Match approval needed
- Transfer failures and exceptions
- Storage expiring alerts
- SLA breaches on open exceptions

**Dashboard needs:**
- Pipeline board (items, requests, matches, transfers)
- Exception queue
- Today's scheduled pickups and deliveries
- Quick search by name, zip, partner, status

| Access Level | Scope |
|--------------|-------|
| **MVP** | Full admin console (Airtable/spreadsheet or simple web admin); sole operational role |
| **Future** | Scoped coordinator console; some actions escalate to Administrator |

---

### Sleepwell Administrator

**Description:** Higher-level operational and system leader with full platform control: user management, partner onboarding, permissions, reporting, policy exceptions, and mission guardrails enforcement.

**Primary goals:**
- Govern who has access and what partners are trusted
- Ensure mission alignment (direct transfer, minimal storage)
- Produce reporting for leadership and funders
- Configure system behavior and manage escalations

**What they can submit:**
- Everything Coordinator can submit
- User role grants and revocations
- Partner organization onboarding, tier changes, suspension
- Storage exception approvals beyond standard limits
- Tax receipt generation and voiding (Phase 4+)
- Policy and taxonomy configuration
- Data export requests (with logging)

**What they can view:**
- Everything Coordinator can view
- All users, roles, and permission history
- All partner organizations and quality metrics
- Full audit log
- System-wide reports and analytics
- Tax receipts and impact records
- Board-level summary reports

**What they can edit:**
- All coordinator-editable records
- User accounts and role assignments
- Partner org status (`active`, `probation`, `suspended`, `terminated`)
- System settings, notification templates, item taxonomy
- Retention and anonymization flags (future)

**What they cannot access:**
- Immutable audit log modification (no role can delete audit rows)
- Recipient/donor PII without legitimate operational purpose (policy, not technical restriction—but access logged)

**Key workflows:**
- Workflow 3 partner onboarding approval
- Workflow 8 storage exception policy approval
- Workflow 9 tax receipt oversight
- Workflow 10 critical exception escalation
- All coordinator workflows

**Privacy restrictions:**
- Highest operational access; subject to organizational data policy and access logging
- Board reporting should use aggregated exports when possible

**Notification needs:**
- Critical exceptions and fraud flags
- Partner probation/suspension triggers
- Storage policy violations
- System health and integration failures

**Dashboard needs:**
- Coordinator dashboard plus: user management, partner management, system settings
- Audit log viewer
- Organization-wide KPIs
- Export tools

| Access Level | Scope |
|--------------|-------|
| **MVP** | Same person as Coordinator often; single `admin` role in database |
| **Future** | Split `coordinator` and `administrator` permission scopes; separate logins |

---

### Board / Read-Only Viewer

**Description:** Board member, funder, or oversight stakeholder with read-only access to aggregated mission metrics—not operational case management.

**Primary goals:**
- Verify mission fidelity and outcomes
- Review growth, fulfillment, and efficiency trends
- Ensure accountability without accessing individual PII

**What they can submit:**
- Nothing operational (optional board meeting notes outside system)

**What they can view:**
- Aggregated dashboards: transfers completed, median time-to-delivery, storage exception rate, partner count, donor repeat rate
- Anonymized impact summaries
- High-level exception counts by category (not case details)
- Financial summary exports if integrated (future)
- Constitution and policy documents (public or internal)

**What they can edit:**
- Nothing in operational tables
- Own viewer account preferences only

**What they cannot access:**
- Individual donor, recipient, or volunteer PII
- Exact addresses, phones, or case notes
- Match creation, approvals, or scheduling
- User management, partner management, audit log line items (aggregates only)
- Raw data exports with PII (unless explicit board resolution and Administrator grant)

**Key workflows:**
- None operational; consumes reporting outputs only

**Privacy restrictions:**
- Aggregated data only by default
- Individual stories only if anonymized and consent-documented
- Access reviewed annually

**Notification needs:**
- Monthly or quarterly summary report delivery (email PDF or dashboard link)
- Critical mission drift alerts (e.g., storage rate exceeds threshold)

**Dashboard needs:**
- Read-only KPI dashboard
- Trend charts: volume, fulfillment, direct-transfer rate, volunteer utilization
- No pipeline edit controls

| Access Level | Scope |
|--------------|-------|
| **MVP** | PDF/email reports manually sent by Administrator; no platform login |
| **Future (Phase 6+)** | Read-only dashboard login with aggregate views only |

---

## Permissions Matrix

Legend: **Yes** = full access · **Own** = own records only · **Scoped** = limited by assignment/referral · **Area** = city/zip only · **Approve** = review + approve · **—** = no access · **Agg** = aggregated only

| Action | Public | Donor | Recipient | Volunteer | Partner User | Partner Admin | Coordinator | Administrator | Board |
|--------|--------|-------|-----------|-----------|--------------|---------------|-------------|---------------|-------|
| Submit furniture donation | Yes | Yes | — | — | — | — | Yes¹ | Yes¹ | — |
| Submit recipient request | — | — | Own | — | Scoped | Scoped | Yes¹ | Yes¹ | — |
| Submit partner referral | — | — | — | — | Yes | Yes | Yes¹ | Yes¹ | — |
| View own submissions | — | Own | Own | Own | Scoped | Org | Yes | Yes | — |
| View own recipient status | — | — | Own | — | Scoped | Org | Yes | Yes | — |
| View available matched item | — | Own | Own | Scoped | — | — | Yes | Yes | — |
| View donor exact address | — | Own | Area² | Scoped² | — | — | Yes | Yes | — |
| View recipient exact address | — | Area² | Own | Scoped² | Scoped | Scoped | Yes | Yes | — |
| Approve donor item | — | — | — | — | — | — | Yes | Yes | — |
| Approve recipient request | — | — | — | — | — | — | Yes | Yes | — |
| Create match | — | — | — | — | — | — | Yes | Yes | — |
| Approve match | — | — | — | — | — | — | Yes | Yes | — |
| Schedule pickup | — | Own | Own | — | — | — | Yes | Yes | — |
| Schedule delivery | — | Own | Own | Scoped | — | — | Yes | Yes | — |
| Assign volunteer | — | — | — | — | — | — | Yes | Yes | — |
| View volunteer details | — | — | — | Own | — | — | Yes | Yes | Agg |
| Create tax receipt | — | — | — | — | — | — | — | Yes | — |
| View impact reports | — | Own | Own³ | — | — | — | Yes | Yes | Agg |
| View partner reports | — | — | — | — | — | Org | Yes | Yes | Agg |
| Manage users | — | — | — | — | — | Staff⁴ | Limited⁵ | Yes | — |
| Manage partner organizations | — | — | — | — | — | — | — | Yes | — |
| Export data | — | — | — | — | — | — | — | Yes⁶ | Agg⁷ |
| View audit log | — | — | — | — | — | — | Partial⁸ | Yes | — |

**Footnotes:**

1. Coordinator/Administrator submit on behalf of users without accounts (low-tech pathway).
2. Exact address revealed after match approved and transfer scheduling initiated; volunteer sees only assigned task addresses.
3. Recipient sees own outcome summary, not donor identity.
4. Partner Admin manages staff within their org only—not Sleepwell roles.
5. Coordinator creates user records; cannot grant admin/board roles.
6. Administrator export logged; PII export policy-controlled.
7. Board receives pre-built aggregate exports only.
8. Coordinator sees case-related communications; not full permission-change audit.

---

## Privacy Model

### Address & Location Visibility

| Data | Public | Donor | Recipient | Volunteer | Partner | Coordinator+ |
|------|--------|-------|-----------|-----------|---------|--------------|
| Donor city/zip | — | Own | Area after match | Assigned task | — | Yes |
| Donor exact address | — | Own | After schedule² | Assigned pickup only | — | Yes |
| Recipient city/zip | — | Area after match | Own | Assigned task | Own clients | Yes |
| Recipient exact address | — | After schedule² | Own | Assigned delivery only | Own active clients | Yes |
| Meet-point address | — | If set | If scheduled | If assigned | — | Yes |

² Coordinator may mediate contact without exposing exact addresses to both parties (MVP default for dignity and safety).

### Identity & Contact Visibility

| Data | When Visible | To Whom |
|------|--------------|---------|
| Recipient full name | After referral conversion | Partner (own clients), Coordinator, Administrator |
| Donor full name | After match approval | Recipient (first name often sufficient), Coordinator |
| Phone numbers | Active transfer coordination | Parties to transfer, assigned volunteer, coordinator |
| Partner case notes | Never | Donors, volunteers, other partners |
| Match scores | Internal | Coordinator, Administrator |
| Impact stories | After `story_consent` | Donor (enriched), public (anonymized only) |

### Enforcement Rules

1. **Row-level security** scopes partner data by `partner_organization_id`.
2. **Assignment-scoped access** for volunteers: permissions expire when `volunteer_assignments.status` = `completed`.
3. **Audit logging** for `address.viewed`, `match.approved`, and `export.requested` events.
4. **Strictest rule wins** when a user holds multiple roles (e.g., donor + volunteer on same match—coordinator mediates conflict).
5. **No public inventory API** exposing donor locations or recipient needs.

### Data Minimization by Intake Path

| Intake Path | Minimum Collected |
|-------------|-------------------|
| Public donation form | Name, contact, item details, zip/city |
| Partner referral | Client name, contact, needs, move-in date, housing confirmed |
| Coordinator phone intake | Same as above; no account required |

---

## MVP Role Strategy

### MVP Roles (Phase 1)

Keep the first working version simple. Most participants do **not** need logins.

| Role | MVP Implementation |
|------|---------------------|
| **Public Visitor** | Static site + public forms |
| **Donor** | Public form → `furniture_items` record; email/phone updates |
| **Recipient** | Partner-mediated or coordinator-created; phone/SMS coordination |
| **Partner User** | Referral form with `referral_code`; email status from coordinator |
| **Coordinator / Administrator** | Single combined `admin` role; spreadsheet or minimal admin UI |
| **Volunteer** | Coordinator assigns manually; name in transfer notes |
| **Partner Admin** | Deferred; director gets same form + email reports |
| **Board Viewer** | Deferred; manual PDF reports |

### MVP Authentication

- **No public login** required for donors, recipients, or partners in Phase 1
- **Admin login** only (email magic link or password)
- Optional email verification when creating records from forms
- Role stored as `user_roles` when account exists; otherwise coordinator owns record

### MVP Permission Implementation

```
IF no session:
  public forms only

IF session.role = admin:
  full coordinator + administrator permissions (combined)

ELSE:
  deny
```

### Deferred to Later Phases

| Capability | Phase |
|------------|-------|
| Donor login and dashboard | 3 |
| Recipient login and dashboard | 3 |
| Match engine suggestions UI | 2 |
| Volunteer portal and task claim | 5 |
| Partner portal and org dashboard | 6 |
| Partner Admin staff management | 6 |
| Board read-only dashboard | 6+ |
| Split coordinator vs administrator | 3–6 |
| Fine-grained permission scopes | 6+ |

---

## Role Evolution by Phase

### Phase 1: Foundation & Validation

**Operational model:** Manual coordination, basic forms, phone follow-up.

| Role | Capabilities |
|------|--------------|
| Public Visitor | Marketing site, donation form, partner inquiry |
| Donor | Form submission; coordinator callback |
| Recipient | Partner or coordinator intake; no self-service |
| Partner User | Referral form with code; email status |
| Coordinator/Admin | Full pipeline in admin tool; manual matching |
| Volunteer | Manual assignment by coordinator |

**Permissions focus:** Admin-only write access to operational data; public create-only forms.

---

### Phase 2: Matching Engine

**Operational model:** Ranked match suggestions; human approval required.

| Role | New Capabilities |
|------|------------------|
| Coordinator | View match candidates and scores; approve/override matches |
| Administrator | Tune matching weights; view override analytics |
| Donor / Recipient | Still mostly out-of-band notifications |

**Permissions focus:** Match score visibility restricted to Coordinator+; override reason required.

---

### Phase 3: User Accounts & Dashboards

**Operational model:** Self-service status for donors and recipients.

| Role | New Capabilities |
|------|------------------|
| Donor | Login, view listings, confirm match timing, availability calendar |
| Recipient | Login, view request status, confirm delivery windows |
| Coordinator | Reduced inbound calls; pipeline exceptions focus |
| Administrator | User management, role grants for donor/recipient accounts |
| Volunteer | Account creation possible; full portal still Phase 5 |

**Permissions focus:** Role-based dashboards; row ownership by `user_id`; split coordinator/administrator scopes introduced.

---

### Phase 4: Geographic Intelligence

**Operational model:** Zip/radius matching; map-assisted coordination.

| Role | New Capabilities |
|------|------------------|
| Coordinator | Map view of items and requests (zip/cluster level) |
| Volunteer | Route view for assigned multi-stop tasks (future) |
| Donor/Recipient | See distance context ("about 4 miles") not exact map pins of others |

**Permissions focus:** Geocoded fields hidden from public; fuzzy `display_location` for non-admin roles.

---

### Phase 5: Volunteer Network

**Operational model:** Volunteers claim delivery tasks; reliability tracking.

| Role | New Capabilities |
|------|------------------|
| Volunteer | Full portal, task claim, hours logging, skills profile |
| Coordinator | Assign or approve volunteer claims; view reliability |
| Donor/Recipient | See assigned volunteer first name and task contact |

**Permissions focus:** Assignment-scoped address access; volunteer cannot browse unrelated records.

---

### Phase 6: Partner Portal & Board Access

**Operational model:** Partners as primary intake channel; oversight reporting.

| Role | New Capabilities |
|------|------------------|
| Partner User | Login, referral dashboard, client status tracking |
| Partner Admin | Org-wide referrals, staff invites, fulfillment reports |
| Board Viewer | Read-only aggregate dashboard |
| Administrator | Partner tier management, cross-org analytics |

**Permissions focus:** Org-scoped row-level security; board aggregate-only views; export controls.

---

## Multi-Role Users

One `users` row may hold multiple `user_roles` entries. Common combinations:

| Combination | Notes |
|-------------|-------|
| Donor + Volunteer | Common; must not see recipient address on own donation match while also volunteering another task |
| Partner User + Donor | Case manager donates furniture; partner scope and donor scope independent |
| Coordinator + Volunteer | Staff may help with deliveries; use volunteer assignment flow, not admin bypass |
| Recipient + Volunteer | Supported; dignity-sensitive UX keeps roles separate in UI |

**Rule:** Application checks permissions per action, not per session default role. PII access uses strictest applicable privacy rule.

---

## Database & Auth Mapping

| Document Role | `roles.code` (MVP) | Future `permission_scope` |
|---------------|-------------------|---------------------------|
| Donor | `donor` | `donor` |
| Recipient | `recipient` | `recipient` |
| Volunteer | `volunteer` | `volunteer` |
| Partner User | `partner_user` | `partner_user` |
| Partner Admin | `partner_user` + org flag | `partner_admin` |
| Coordinator | `admin` | `coordinator` |
| Administrator | `admin` | `administrator` |
| Board Viewer | — | `board_viewer` |
| Public Visitor | — (no row) | — |

**Partner scoping:** `partner_users.partner_organization_id` determines row-level access for all partner roles.

**Volunteer scoping:** `volunteer_assignments` determines time-bounded address access.

---

## Notification Matrix (Summary)

| Event | Donor | Recipient | Volunteer | Partner | Coordinator |
|-------|-------|-----------|-----------|---------|-------------|
| Item approved/rejected | Yes | — | — | — | — |
| Request approved | — | Yes | — | Yes | — |
| Match approved | Yes | Yes | — | Yes | — |
| Transfer scheduled | Yes | Yes | Yes | Yes | — |
| Transfer completed | Yes | Yes | Yes | Yes | — |
| Thank-you / impact | Yes | — | — | — | — |
| New submission queue | — | — | — | — | Yes |
| Exception opened | — | — | — | Optional | Yes |

All roles support `communication_preference` and opt-out per channel ([Database Design](database-design.md)).

---

## Open Questions

1. **Recipient self-registration:** If enabled, does it create `recipient` role immediately or remain `pending_verification` until partner/admin approval?
2. **Donor-recipient direct contact:** Should the platform expose phone numbers after match approval, or always coordinator-mediated in early phases?
3. **Partner fast-track:** Do `active` partners get auto-approval of requests, or only expedited coordinator review?
4. **Coordinator vs Administrator split:** At what team size should these become separate logins?
5. **Board Viewer PII exceptions:** Are there board-approved scenarios requiring anonymized case studies with partial PII?
6. **Volunteer background checks:** Should `volunteer_profiles.status` gate task claim before `background_check_cleared`?
7. **Partner Admin without Partner User:** Can directors have admin view without case management submit permissions?

---

## Document Governance

- Review when [Workflows](workflows.md) or [Database Design](database-design.md) change access-related fields
- Review before each roadmap phase that introduces new portals
- Permission changes evaluated against Constitution Articles V (dignity), IX (people we serve), and X (guardrails)

---

*Roles exist to coordinate generosity safely—not to gatekeep dignity.*
