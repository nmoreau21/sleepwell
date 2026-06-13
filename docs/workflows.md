# Sleepwell Workflow Architecture

**Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Master Operational Reference

---

## About This Document

This document defines how Sleepwell operates as a nonprofit resource coordination network—before software is built, and independent of any technical implementation.

It describes real-world operations: human interactions, decision points, resource movement, and exception handling. It is the operational blueprint from which database design, software development, volunteer training, partner agreements, and automation priorities should derive.

**Guiding principle (non-negotiable):**

> Whenever possible, resources move directly from donor to recipient.

Storage, warehousing, and paid logistics are exceptions—not defaults.

**Related documents:**

- [Constitution](constitution.md) — mission, values, and guardrails
- [Roadmap](roadmap.md) — phased platform development
- [User Types](user-types.md) — role definitions (planned)
- [Database Design](database-design.md) — data model (planned)

---

## Workflow Design Principles

Every workflow in Sleepwell should:

| Principle | Operational Meaning |
|-----------|---------------------|
| Minimize overhead | Fewer steps, fewer staff touches, fewer duplicate data entry |
| Prioritize direct transfer | Donor → recipient is the default path for every item |
| Encourage community participation | Donors, volunteers, and partners act; staff coordinate |
| Reduce transportation cost | Proximity matching, pickup first, route-efficient volunteer use |
| Protect recipient dignity | Choice, privacy, quality standards, no stigma-heavy processes |
| Scale through coordination | Network growth, not warehouse growth |
| Automate later | Document human judgment first; automate only proven patterns |

**Preferred resource path:**

```
Donor → (optional: volunteer transport) → Recipient
```

**Exception path (requires justification):**

```
Donor → Short-term storage → Recipient
```

---

## Cross-Workflow Lifecycle Overview

Most operational objects move through a shared lifecycle pattern. Individual workflows below define role-specific status names and rules.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Intake     │ →  │  Review     │ →  │  Matching   │ →  │  Transfer   │
│  (capture)  │    │  (validate) │    │  (pair)     │    │  (move)     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                              │                    │
                                              ▼                    ▼
                                       ┌─────────────┐    ┌─────────────┐
                                       │  Exception  │    │  Closed     │
                                       │  (escalate) │    │  (complete) │
                                       └─────────────┘    └─────────────┘
```

**Global success metrics (organization-level):**

- Median time from verified need to fulfilled transfer under 14 days (pilot target)
- Storage used in fewer than 10% of completed transfers
- Direct pickup or donor-to-recipient transfer in majority of completions
- Documented reason for every exception path

---

## Workflow 1: Donor Submission

### Purpose

Capture donated furniture and household resources into the coordination network so they can be matched to verified recipient needs—without assuming warehouse intake.

### Actors

| Actor | Role |
|-------|------|
| **Donor** | Submits items, provides photos, confirms availability, participates in transfer |
| **Administrator** | Reviews submissions, approves or rejects, resolves duplicates and incomplete data |

### Trigger

- Donor completes intake (web form, phone intake, partner-facilitated submission, or referral from Buy Nothing / estate sale / business donor)
- Donor updates an existing listing (availability change, new photos, withdrawal)

### Step-by-Step Process

```
Donor                    Administrator              Network
  │                            │                        │
  │── Submit item ────────────►│                        │
  │   (photos, location,       │                        │
  │    condition, category)    │                        │
  │                            │── Review submission ──►│
  │                            │                        │
  │         ┌──────────────────┴──────────────────┐    │
  │         │ Incomplete? → Request info          │    │
  │         │ Duplicate?  → Merge or reject       │    │
  │         │ Unacceptable? → Reject with reason  │    │
  │         │ Acceptable? → Approve               │    │
  │         └──────────────────┬──────────────────┘    │
  │                            │                        │
  │◄── Status notification ────│── Item AVAILABLE ────►│
  │                            │   (eligible for match) │
```

1. **Donor submits item** — category, description, quantity, dimensions (when relevant), pickup constraints (stairs, disassembly needed, time windows).
2. **Photos uploaded** — minimum one clear photo; multiple angles for large or high-value items; condition visible.
3. **Location captured** — address or approximate area for proximity matching; privacy options for donors who prefer meet-point pickup.
4. **Condition assessed** — donor self-report plus administrator review against acceptance standards.
5. **Item reviewed** — administrator checks completeness, safety, duplication, and mission fit.
6. **Approved or rejected** — donor notified with clear reason; rejected items are not held in inventory.
7. **Item becomes available** — enters active matching pool with expiration date and availability window.

### Decision Points

```
                    ┌─────────────────┐
                    │ Submission      │
                    │ received        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Complete info   │
                    │ and photos?     │
                    └────────┬────────┘
                         No  │  Yes
              ┌──────────────┼──────────────┐
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │ INCOMPLETE      │           │ Duplicate of    │
    │ Request info    │           │ existing item?  │
    │ (hold 7 days)   │           └────────┬────────┘
    └─────────────────┘                Yes │ No
              │              ┌─────────────┼─────────────┐
              │              ▼                           ▼
              │    ┌─────────────────┐         ┌─────────────────┐
              │    │ DUPLICATE       │         │ Meets acceptance  │
              │    │ Merge or reject │         │ standards?        │
              │    └─────────────────┘         └────────┬────────┘
              │                                    No   │  Yes
              │              ┌──────────────────────────┼──────────┐
              │              ▼                          ▼          │
              │    ┌─────────────────┐         ┌─────────────────┐ │
              │    │ REJECTED        │         │ APPROVED        │ │
              │    │ Notify donor    │         │ AVAILABLE       │ │
              │    └─────────────────┘         └─────────────────┘ │
              │                                                  │
              └──────────── Expired / abandoned ────────────────┘
                            → WITHDRAWN or EXPIRED
```

**Acceptance standards (default):**

- Functional and safe for intended use
- Clean enough that staff would place it in their own home
- No structural damage, pest infestation, or strong odors
- No recalled, prohibited, or unsanitary items (see Exception Management)
- Donor willing to release item directly to recipient or volunteer pickup

### Exceptions

| Exception | Handling |
|-----------|----------|
| **Accepted items** | Move to `AVAILABLE`; begin matching when recipient need exists |
| **Rejected items** | Status `REJECTED`; reason recorded; donor may resubmit corrected listing |
| **Duplicate submissions** | Link to primary listing or reject duplicate; notify donor |
| **Incomplete submissions** | Status `INCOMPLETE`; automated reminder at 48h and 7 days; auto-close if no response |
| **Expired listings** | Status `EXPIRED` after donor-defined or default window (e.g., 30 days); donor may renew |
| **Donor withdrawal** | Status `WITHDRAWN`; remove from matching pool immediately |
| **Conditional acceptance** | Status `AVAILABLE — CONDITIONAL` (e.g., "available only if picked up by Friday") |

### Success Criteria

- Submission reviewed within 48 hours (business days)
- Donor receives clear status within 24 hours of review completion
- Approved items have photos, location, category, and availability window
- Rejection reasons are specific and actionable
- Zero approved items enter warehouse without explicit storage-exception workflow

### Status Definitions

| Status | Meaning | Who Acts Next |
|--------|---------|---------------|
| `SUBMITTED` | Intake received, not yet reviewed | Administrator |
| `INCOMPLETE` | Missing required information or photos | Donor |
| `UNDER_REVIEW` | Administrator actively reviewing | Administrator |
| `APPROVED` / `AVAILABLE` | Eligible for matching | Matching workflow |
| `MATCH_PENDING` | Candidate match identified, not yet confirmed | Matching / transfer workflows |
| `MATCHED` | Paired with recipient; transfer scheduling underway | Transfer workflows |
| `TRANSFERRED` | Item successfully moved to recipient | Donor impact workflow |
| `REJECTED` | Not accepted; will not be matched | Donor (optional resubmit) |
| `EXPIRED` | Listing timed out without match or renewal | Donor (optional renew) |
| `WITHDRAWN` | Donor removed item from network | None |

---

## Workflow 2: Recipient Request

### Purpose

Capture verified recipient needs so the coordination network can match available resources to people transitioning into stable housing—with appropriate priority, dignity, and partner accountability.

### Actors

| Actor | Role |
|-------|------|
| **Recipient** | Describes needs, confirms housing readiness, participates in match and transfer |
| **Community Partner** | Verifies eligibility, submits or supports request, advocates for urgency |
| **Administrator** | Validates request, assigns priority, approves queue placement, resolves gaps |

### Trigger

- Partner submits referral on behalf of client (primary path)
- Recipient submits request directly (secondary path; requires verification before approval)
- Partner or recipient updates an open request (new items, move-in date change, cancellation)
- Emergency housing placement with immediate furnishing need

### Step-by-Step Process

```
Partner/Recipient          Administrator              Queue
        │                        │                        │
        │── Request submitted ──►│                        │
        │   (needs, move-in date,│                        │
        │    household, access)  │                        │
        │                        │── Verify eligibility ─►│
        │                        │── Assess needs         │
        │                        │── Assign priority      │
        │                        │── Approve or hold      │
        │                        │                        │
        │◄── Status update ──────│── APPROVED / QUEUED ──►│
        │                        │   (eligible for match) │
```

1. **Request submitted** — essential items needed, household size, housing address or area, move-in date, access constraints (stairs, elevator, parking).
2. **Verification** — housing stability confirmed via partner referral or administrator follow-up; identity and need validated without redundant humiliation.
3. **Priority assignment** — based on urgency, vulnerability, partner tier, and completeness of housing placement.
4. **Need assessment** — distinguish essential vs. optional items; flag items requiring delivery vs. pickup-capable.
5. **Approval** — request enters active matching queue or returns for more information.
6. **Queue placement** — ordered by priority, geography, and date; visible to administrators and partners (not public).

### Decision Points

```
                 ┌─────────────────┐
                 │ Request         │
                 │ received        │
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
                 │ Partner referral  │
                 │ or verified path? │
                 └────────┬────────┘
                      No  │  Yes
           ┌──────────────┼──────────────┐
           ▼                             ▼
  ┌─────────────────┐          ┌─────────────────┐
  │ PENDING         │          │ Complete needs  │
  │ VERIFICATION    │          │ and housing info?│
  └────────┬────────┘          └────────┬────────┘
           │                       No   │  Yes
           │            ┌───────────────┼───────────────┐
           │            ▼                               ▼
           │   ┌─────────────────┐            ┌─────────────────┐
           │   │ INCOMPLETE      │            │ Emergency flag? │
           │   └─────────────────┘            └────────┬────────┘
           │                                    Yes   │  No
           │            ┌──────────────────────────────┼──────────┐
           │            ▼                              ▼          │
           │   ┌─────────────────┐            ┌─────────────────┐ │
           │   │ EMERGENCY       │            │ STANDARD        │ │
           │   │ Expedited queue │            │ Queue placement │ │
           │   └─────────────────┘            └─────────────────┘ │
           │                                                      │
           └──────────── Unverified / withdrawn ──────────────────┘
                         → CLOSED or CANCELLED
```

### Exceptions

| Exception | Handling |
|-----------|----------|
| **Emergency requests** | Flag `EMERGENCY`; expedited review within 24 hours; matching prioritizes essential items first |
| **Partner-submitted requests** | Pre-verified path; partner accountable for housing readiness |
| **Direct recipient requests** | Require verification call or partner linkage before approval |
| **Missing information** | Status `INCOMPLETE`; partner or recipient completes; 14-day hold before auto-close |
| **Request expiration** | Open requests expire after 60 days without activity; partner notified; may renew with updated move-in context |
| **Duplicate requests** | Merge with existing open request for same household |
| **Recipient unresponsive** | After 3 contact attempts over 7 days, pause matching; partner engaged; may close if unresolved |

### Success Criteria

- Verified requests approved within 48 hours (emergency within 24 hours)
- Every approved request has documented essential-item list and access notes
- Partner can see status without calling staff
- Recipient never asked to re-prove need unnecessarily
- Queue order is transparent to administrators and auditable

### Status Definitions

| Status | Meaning | Who Acts Next |
|--------|---------|---------------|
| `SUBMITTED` | Intake received | Administrator |
| `PENDING_VERIFICATION` | Awaiting housing/need confirmation | Partner or Administrator |
| `INCOMPLETE` | Missing required fields | Partner or Recipient |
| `UNDER_REVIEW` | Administrator assessing needs and priority | Administrator |
| `APPROVED` | Verified and eligible for matching | Matching workflow |
| `QUEUED` | Active in matching queue | Matching workflow |
| `PARTIALLY_MATCHED` | Some needs fulfilled, others open | Matching workflow |
| `FULLY_MATCHED` | All essential needs have approved matches | Transfer workflows |
| `FULFILLED` | All transfers confirmed complete | Donor impact / partner reporting |
| `ON_HOLD` | Paused (unresponsive, housing delay, etc.) | Partner or Administrator |
| `CANCELLED` | Recipient or partner withdrew request | None |
| `EXPIRED` | Timed out without fulfillment or renewal | Partner (optional renew) |
| `CLOSED` | Administratively closed with reason | None |

---

## Workflow 3: Partner Referral Workflow

### Purpose

Allow trusted organizations to refer recipients into the network—bringing verification, reach, and accountability so Sleepwell can focus on coordination rather than gatekeeping.

### Actors

| Actor | Role |
|-------|------|
| **Community Partner** | Rehab centers, sober living orgs, re-entry programs, churches, social workers, case managers |
| **Recipient** | Client of partner; may participate directly after referral |
| **Administrator** | Onboards partners, reviews referrals, tracks partner quality, produces partner reporting |

### Trigger

- New partner organization applies to join network
- Existing partner submits client referral
- Partner requests status update or escalates urgent case
- Quarterly partner reporting cycle

### Step-by-Step Process

#### Partner Onboarding

```
Partner Applicant        Administrator           Network
        │                      │                    │
        │── Application ──────►│                    │
        │   (org type, contact,│                    │
        │    service area)     │                    │
        │                      │── Review fit ─────►│
        │                      │── Reference check  │
        │                      │── Approve / deny   │
        │◄── Partner agreement │                    │
        │    and portal access │── ACTIVE PARTNER ──►│
```

1. Partner submits application with organization type, service area, and primary contact.
2. Administrator reviews mission alignment, referral capacity, and data-handling practices.
3. Partner agreement signed (referral standards, privacy, communication expectations).
4. Partner receives referral codes, training materials, and status visibility.
5. Partner enters `ACTIVE` status and may submit referrals.

#### Referral Processing

1. **Partner submits referral** — client needs, move-in date, housing confirmation, urgency, partner notes (not excessive personal detail).
2. **Referral reviewed** — administrator confirms partner is active, referral is complete, no duplicate client record.
3. **Recipient approved** — client record created or linked; Workflow 2 (Recipient Request) begins with partner as verifier.
4. **Needs assessed** — essential items identified; delivery vs. pickup capability documented.
5. **Matching begins** — request enters queue with partner priority tier applied.

### Decision Points

```
Partner Onboarding:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Application  │ ──► │ Mission fit? │ No  │ DENIED       │
│ received     │     └──────┬───────┘     └──────────────┘
└──────────────┘            │ Yes
                            ▼
                   ┌──────────────┐     ┌──────────────┐
                   │ Agreement    │ ──► │ ACTIVE       │
                   │ signed?        │     │ PARTNER      │
                   └──────────────┘     └──────────────┘

Referral:
┌──────────────┐     ┌──────────────┐
│ Referral     │ ──► │ Partner      │ No  │ REJECTED /
│ submitted    │     │ active?      │     │ RETURNED
└──────────────┘     └──────┬───────┘
                            │ Yes
                            ▼
                   ┌──────────────┐     ┌──────────────┐
                   │ Duplicate    │ Yes │ MERGE with   │
                   │ client?      │     │ existing     │
                   └──────┬───────┘     └──────────────┘
                          │ No
                          ▼
                   ┌──────────────┐
                   │ Create request │
                   │ → Workflow 2   │
                   └──────────────┘
```

### Exceptions

| Exception | Handling |
|-----------|----------|
| **Partner not yet approved** | Referral held; partner onboarding expedited if urgent |
| **Low-quality referrals** | Repeated incomplete or unverified referrals trigger partner coaching; tracked in referral quality score |
| **Partner suspension** | Status `SUSPENDED` for policy violations; referrals not accepted until resolved |
| **Client no longer eligible** | Partner notifies; request cancelled with reason |
| **Conflicting referrals** | Two partners refer same client → merge records; primary partner designated |

### Partner Reporting

Partners receive periodic summaries:

- Referrals submitted vs. fulfilled
- Average time from referral to first delivery
- Open requests and blockers
- Client outcomes (optional 30/60/90-day stability confirmation)

### Success Criteria

- Partner onboarding completed within 14 days of application
- 100% of active partners can see referral status without staff contact
- Referral-to-approved-request within 48 hours for complete submissions
- Referral quality metrics reviewed quarterly
- Partners report Sleepwell coordination as easier than alternative furniture sources

### Status Definitions

**Partner organization status:**

| Status | Meaning |
|--------|---------|
| `APPLICANT` | Application received |
| `UNDER_REVIEW` | Administrator reviewing |
| `ACTIVE` | May submit referrals |
| `PROBATION` | Quality concerns; enhanced review |
| `SUSPENDED` | Referrals not accepted |
| `INACTIVE` | Voluntary or seasonal pause |
| `TERMINATED` | Relationship ended |

**Referral status:**

| Status | Meaning |
|--------|---------|
| `SUBMITTED` | Referral received |
| `UNDER_REVIEW` | Administrator processing |
| `ACCEPTED` | Linked to recipient request (Workflow 2) |
| `RETURNED` | Sent back to partner for missing info |
| `REJECTED` | Not accepted (with reason) |
| `CONVERTED` | Recipient request approved and queued |
| `FULFILLED` | Client needs met per agreement |
| `CLOSED` | Closed without full fulfillment |

---

## Workflow 4: Matching Engine Workflow

### Purpose

Pair available donor resources with verified recipient needs—priorizing proximity, fit, urgency, and dignity—while keeping human judgment in the loop for conflicts and edge cases.

### Actors

| Actor | Role |
|-------|------|
| **System** | Identifies candidates, generates match scores, surfaces ranked suggestions |
| **Administrator** | Reviews suggestions, approves or overrides matches, resolves conflicts |
| **Recipient** | Confirms ability to receive item (pickup or delivery) |
| **Donor** | Confirms availability for proposed transfer timing (implicit in later workflows) |

### Trigger

- New item becomes `AVAILABLE`
- New recipient request becomes `QUEUED`
- Existing match fails, expires, or is rejected
- Administrator initiates manual search for hard-to-match item or need

### Matching Factors

| Factor | Weight (conceptual) | Notes |
|--------|---------------------|-------|
| Item category fit | Required | Must match need type or acceptable substitute |
| Geographic distance | High | Primary efficiency signal; direct transfer depends on proximity |
| Urgency / move-in date | High | Emergency and imminent move-in prioritized |
| Household size | Medium | Beds, seating, table capacity |
| Partner priority tier | Medium | Trusted partners with verified urgent placements |
| Delivery requirements | High | If recipient cannot pickup, match must account for volunteer capacity |
| Item condition vs. need | Medium | Recipient dignity standards |
| Donor availability window | Medium | Must overlap with recipient or volunteer availability |
| Prior match history | Low | Avoid repeated failed matches for same parties |

### Step-by-Step Process

```
AVAILABLE Item          Matching Engine           Administrator
      │                       │                        │
      │── Trigger match ─────►│                        │
      │                       │── Identify candidates  │
      │                       │   (queued requests)    │
      │                       │── Score each pair      │
      │                       │── Rank suggestions ───►│
      │                       │                        │── Review top candidates
      │                       │                        │── Approve or override
      │                       │                        │
      │                       │◄── MATCH APPROVED ─────│
      │                       │                        │
      │                       │── Reserve resource ───►│ Transfer workflow
      │                       │   (donor + recipient)  │
```

1. **Item available** (or request queued) triggers candidate search.
2. **Candidate recipients identified** — same geography, open need for item category, approved status.
3. **Match score generated** — weighted factors produce ranked list with explainable rationale.
4. **Match reviewed** — administrator examines top suggestion(s); may override with documented reason.
5. **Match approved** — both sides notified; item and need line items move to reserved state.
6. **Resource reserved** — item not offered to other recipients; recipient need line not matched elsewhere.

### Decision Points

```
┌─────────────────┐
│ Match candidates│
│ identified      │
└────────┬────────┘
         │
┌────────▼────────┐     No   ┌─────────────────┐
│ Score above     │ ───────► │ NO_MATCH        │
│ minimum threshold?│         │ Hold or expand  │
└────────┬────────┘         │ search radius   │
         │ Yes               └─────────────────┘
┌────────▼────────┐
│ Single best     │     No   ┌─────────────────┐
│ candidate?      │ ───────► │ CONFLICT        │
└────────┬────────┘         │ Admin chooses   │
         │ Yes               └─────────────────┘
┌────────▼────────┐
│ Recipient can   │     No   ┌─────────────────┐
│ receive (pickup │ ───────► │ Route to        │
│ or delivery)?   │         │ delivery workflow│
└────────┬────────┘         └─────────────────┘
         │ Yes
┌────────▼────────┐
│ MATCH APPROVED  │
│ → Transfer path │
└─────────────────┘
```

### Exceptions

| Exception | Handling |
|-----------|----------|
| **Match conflicts** | Multiple recipients score similarly → administrator selects; runner-up notified if primary declines |
| **Multiple candidates for one item** | Ranked queue; first approved match reserves item; others remain in queue for other items |
| **Match rejection** | Donor or recipient declines → status `MATCH_REJECTED`; reason logged; re-enter matching pool |
| **Expired matches** | Approved match not scheduled within 7 days → status `MATCH_EXPIRED`; item/request released |
| **Partial set matching** | Bed frame without mattress → match as set or flag incomplete; do not ship mismatched essentials without acknowledgment |
| **Override** | Administrator chooses non-top suggestion → override reason required for learning |

### Success Criteria

- Candidate list generated within minutes of trigger (human review aside)
- 100% of approved matches have audit trail (score, factors, approver)
- Match expiration prevents silent stale reservations
- Override rate tracked; high override signals rule tuning needed
- Essential needs matched before optional items

### Status Definitions

| Status | Meaning |
|--------|---------|
| `UNMATCHED` | Item or need line awaiting pairing |
| `CANDIDATES_IDENTIFIED` | System has ranked options |
| `PENDING_REVIEW` | Awaiting administrator approval |
| `APPROVED` | Match accepted; transfer not yet scheduled |
| `RESERVED` | Resource locked to specific recipient/donor pair |
| `MATCH_REJECTED` | Party declined; returned to pool |
| `MATCH_EXPIRED` | Approval timed out |
| `OVERRIDDEN` | Non-default match chosen (audit flag) |
| `SCHEDULED` | Transfer date set (see Workflows 5–6) |
| `COMPLETED` | Transfer confirmed |
| `CANCELLED` | Match dissolved before transfer |

---

## Workflow 5: Direct Recipient Pickup

### Purpose

Move resources directly from donor to recipient with minimal intermediation. **This is the preferred transfer workflow** whenever the recipient can access transportation.

### Actors

| Actor | Role |
|-------|------|
| **Donor** | Makes item available at agreed time and location |
| **Recipient** | Travels to pickup location, inspects item, transports item |
| **Administrator** | Schedules, mediates disputes, handles failures |
| **Community Partner** | Optional: assists recipient with transport coordination |

### Trigger

- Match approved and recipient indicates pickup capability
- Administrator routes match to pickup path (default when delivery not required)

### Step-by-Step Process

```
Match Approved          Administrator          Donor / Recipient
      │                       │                        │
      │                       │── Notify both parties ─►│
      │                       │                        │
      │                       │◄── Availability ───────│
      │                       │                        │
      │                       │── Schedule pickup ────►│
      │                       │   (time, location,     │
      │                       │    contact protocol)    │
      │                       │                        │
      │                       │                        │── Pickup occurs
      │                       │                        │
      │                       │◄── Confirmation ───────│
      │                       │                        │
      │                       │── Close match ────────►│ Donor impact workflow
```

1. **Match approved** — pickup path selected.
2. **Recipient notified** — item details, donor location or meet-point, dignity-preserving pickup etiquette guidance.
3. **Donor notified** — recipient contact protocol (often coordinator-mediated at first; direct contact only when appropriate and consented).
4. **Pickup scheduled** — mutual availability window confirmed; calendar reminder sent.
5. **Pickup completed** — recipient obtains item; condition acknowledged.
6. **Confirmation received** — recipient, donor, or administrator confirms success.
7. **Match closed** — item and need line marked fulfilled; impact recorded.

### Decision Points

```
┌─────────────────┐
│ Pickup          │
│ scheduled       │
└────────┬────────┘
         │
┌────────▼────────┐     Yes  ┌─────────────────┐
│ Party cancels   │ ───────► │ RESCHEDULE      │
│ or conflicts?   │          │ (max 2 attempts)│
└────────┬────────┘          └─────────────────┘
         │ No
┌────────▼────────┐     Yes  ┌─────────────────┐
│ No-show?        │ ───────► │ FAILED_PICKUP   │
└────────┬────────┘          │ → Exception mgmt│
         │ No                └─────────────────┘
┌────────▼────────┐     Yes  ┌─────────────────┐
│ Condition       │ ───────► │ DISPUTE         │
│ dispute?        │          │ Admin mediates  │
└────────┬────────┘          └─────────────────┘
         │ No
┌────────▼────────┐
│ PICKUP_COMPLETE │
└─────────────────┘
```

### Exceptions

| Exception | Handling |
|-----------|----------|
| **Scheduling conflicts** | Reschedule up to 2 times; then escalate or route to delivery volunteer |
| **No-shows** | Recipient no-show → partner contacted; donor compensated with apology; match may re-queue. Donor no-show → recipient prioritized for replacement match |
| **Item condition disputes** | Recipient may decline item on site if misrepresented; administrator documents; donor listing reviewed |
| **Failed transfers** | Vehicle too small, item won't fit → attempt delivery workflow or storage exception with justification |
| **Safety concerns** | Either party reports concern → pickup cancelled; administrator investigates |
| **Privacy preference** | Meet at neutral point or coordinator-present pickup when donor or recipient requests |

### Success Criteria

- Pickup scheduled within 5 days of match approval
- Confirmation recorded within 24 hours of scheduled pickup
- Majority of eligible matches complete via pickup path
- Disputes resolved within 48 hours
- Donor and recipient both receive thank-you / next-step communication

### Status Definitions

| Status | Meaning |
|--------|---------|
| `PICKUP_PENDING` | Approved match; scheduling not complete |
| `PICKUP_SCHEDULED` | Date and time confirmed |
| `PICKUP_RESCHEDULED` | New time after conflict |
| `PICKUP_COMPLETE` | Item transferred successfully |
| `PICKUP_FAILED` | Transfer did not occur |
| `PICKUP_DISPUTED` | Condition or conduct issue reported |
| `PICKUP_CANCELLED` | Match dissolved before pickup |

---

## Workflow 6: Volunteer Delivery Workflow

### Purpose

Provide delivery assistance when direct recipient pickup is not possible—using community volunteer labor and vehicles rather than paid logistics by default.

### Actors

| Actor | Role |
|-------|------|
| **Volunteer** | Provides labor, vehicle, or both; executes delivery |
| **Donor** | Makes item available for volunteer pickup |
| **Recipient** | Receives item at housing location; confirms receipt |
| **Administrator** | Creates delivery task, assigns or approves volunteer, handles failures |

### Trigger

- Match approved and recipient cannot pickup (no vehicle, disability, item too large, no helpers)
- Pickup workflow failed and delivery is next option
- Multi-item bundle requires coordinated delivery

### Step-by-Step Process

```
Match Approved          Administrator          Volunteer Pool
      │                       │                        │
      │                       │── Create delivery task │
      │                       │   (items, addresses,   │
      │                       │    vehicle needs)      │
      │                       │                        │
      │                       │── Publish opportunity ─►│
      │                       │                        │
      │                       │◄── Volunteer claims ───│
      │                       │   or admin assigns     │
      │                       │                        │
      │                       │── Confirm schedule ───►│ Donor + Recipient
      │                       │                        │
      │                       │                        │── Execute delivery
      │                       │◄── Completion report ─│
      │                       │                        │
      │                       │── Close + log hours ──►│ Volunteer mgmt
```

1. **Delivery requested** — administrator or system flags delivery need with vehicle type, helpers needed, stairs/access notes.
2. **Volunteers identified** — broadcast to qualified nearby volunteers or targeted assignment.
3. **Assignment accepted** — volunteer claims task; backup volunteer identified for multi-person needs.
4. **Delivery scheduled** — donor pickup window and recipient delivery window aligned.
5. **Pre-delivery check** — volunteer confirms vehicle capacity, helper count, and safety equipment.
6. **Delivery executed** — donor → recipient (or donor → volunteer → recipient); photos optional for disputes.
7. **Delivery completed** — recipient confirms; volunteer hours logged; match closed.

### Decision Points

```
┌─────────────────┐
│ Delivery task   │
│ created         │
└────────┬────────┘
         │
┌────────▼────────┐     No   ┌─────────────────┐
│ Volunteer with  │ ───────► │ BROADCAST /     │
│ right capacity  │         │ EXPAND SEARCH   │
│ available?      │         └────────┬────────┘
└────────┬────────┘                  │
         │ Yes                         │ Timeout
┌────────▼────────┐                  ▼
│ Single volunteer│         ┌─────────────────┐
│ sufficient?     │         │ ESCALATE:       │
└────────┬────────┘         │ partner assist, │
    No     │ Yes             │ paid exception, │
    ▼      │                 │ or storage exc. │
┌───────────┐│                 └─────────────────┘
│ Multi-person│
│ crew needed │
└──────┬────┘
       │
┌──────▼────────┐
│ DELIVERY      │
│ SCHEDULED     │
└───────────────┘
```

### Exceptions

| Exception | Handling |
|-----------|----------|
| **Volunteer cancellation** | Backup volunteer activated; if none, re-broadcast; recipient and donor notified promptly |
| **Multi-person deliveries** | Task flagged `CREW_REQUIRED`; minimum two volunteers for heavy items; no single-person override without admin approval |
| **Large item handling** | Require truck/trailer capability flags; furniture moving experience preferred |
| **Safety considerations** | No delivery without adequate vehicle, straps, and helpers; unsafe access → reschedule with partner support |
| **Volunteer no-show** | Critical failure; reliability score impacted; emergency reassignment |
| **Recipient not home** | Wait window 15 minutes; photo proof if left with partner; reschedule if refused |
| **Item damage in transit** | Document; exception management; donor and recipient notified |

### Success Criteria

- Delivery scheduled within 5 days of task creation when volunteers available
- 100% of deliveries have assigned volunteer before donor release
- Volunteer cancellations replaced within 24 hours when possible
- Zero deliveries attempted without vehicle capacity verification
- Recipient confirmation within 24 hours of delivery

### Status Definitions

| Status | Meaning |
|--------|---------|
| `DELIVERY_REQUESTED` | Need identified; task not yet published |
| `OPEN` | Published to volunteer pool |
| `CLAIMED` | Volunteer accepted |
| `ASSIGNED` | Administrator assigned specific volunteer |
| `CREW_PENDING` | Awaiting second volunteer for multi-person task |
| `DELIVERY_SCHEDULED` | Date and route confirmed |
| `IN_TRANSIT` | Volunteer en route or loading |
| `DELIVERY_COMPLETE` | Recipient confirmed receipt |
| `DELIVERY_FAILED` | Could not complete |
| `DELIVERY_CANCELLED` | Task cancelled before completion |

---

## Workflow 7: Volunteer Management

### Purpose

Recruit, qualify, schedule, and retain community volunteers whose labor and vehicles enable direct transfer at scale—without treating volunteers as unpaid staff doing invisible work.

### Actors

| Actor | Role |
|-------|------|
| **Volunteer** | Registers, declares skills, accepts tasks, completes service |
| **Administrator** | Approves registrations, assigns tasks, tracks reliability, recognizes contributors |
| **System** | Surfaces opportunities matched to skills and geography |

### Volunteer Capability Profile

Volunteers may declare one or more capabilities:

| Capability | Used In |
|------------|---------|
| Truck ownership | Delivery workflow |
| Trailer ownership | Large item delivery |
| Furniture moving | Pickup, delivery, loading |
| Delivery assistance | Delivery workflow (non-driver helper) |
| Furniture assembly | Post-delivery setup |
| Weekend availability | Scheduling priority |
| Weekday availability | Scheduling priority |
| Emergency / urgent response | Expedited broadcast |

### Step-by-Step Process

1. **Volunteer registration** — contact info, background acknowledgment, liability waiver, communication preferences.
2. **Skill selection** — capabilities and vehicle details (make/model, bed length, lift gate, etc.).
3. **Availability management** — recurring windows and blackout dates; updated by volunteer.
4. **Opportunity assignment** — volunteer claims open task or receives targeted offer based on match.
5. **Completion tracking** — task outcome, hours, miles (optional), recipient feedback flag.
6. **Recognition and retention** — thank-you, hours summary, milestone recognition, re-engagement for lapsed volunteers.

### Reliability Scoring (Operational Concept)

Reliability informs assignment priority—not punishment:

| Signal | Effect |
|--------|--------|
| Completed tasks on time | Higher priority for new assignments |
| Cancellation with notice (>24h) | Minor neutral adjustment |
| Late cancellation or no-show | Lower priority; admin review |
| Repeated no-shows | Suspension from auto-assignment |
| Positive recipient feedback | Priority boost for urgent deliveries |

History is visible to administrators; volunteers see their own completion record and hours.

### Decision Points

```
┌─────────────────┐
│ Volunteer       │
│ registers       │
└────────┬────────┘
         │
┌────────▼────────┐     No   ┌─────────────────┐
│ Waiver and      │ ───────► │ INCOMPLETE      │
│ basic info?     │         │ REGISTRATION    │
└────────┬────────┘         └─────────────────┘
         │ Yes
┌────────▼────────┐
│ ACTIVE          │
│ VOLUNTEER       │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Claims │ │ Declines│
│ task   │ │ task    │
└───┬────┘ └────┬────┘
    │           │
    ▼           ▼
 COMPLETE    (no penalty
 + hours      if appropriate)
```

### Exceptions

| Exception | Handling |
|-----------|----------|
| **Underqualified volunteer** | Task requires truck; volunteer has car only → system blocks claim |
| **Overcommitment** | Volunteer with 3 active tasks cannot claim fourth until one completes |
| **Safety incident** | Immediate task release; incident workflow; volunteer support |
| **Lapsed volunteer** | No activity 6 months → gentle re-engagement email; status `INACTIVE` after 12 months |
| **Minor volunteers** | Require guardian waiver; no solo heavy lifting tasks |

### Success Criteria

- Registration to active status within 72 hours
- Volunteers can update availability without staff help
- 100% of completed deliveries have logged volunteer hours
- Reliability scores reviewed monthly for fairness
- Volunteer retention: 50%+ of active volunteers complete 2+ tasks in first year

### Status Definitions

**Volunteer account:**

| Status | Meaning |
|--------|---------|
| `REGISTERED` | Application received |
| `INCOMPLETE` | Missing waiver or skills profile |
| `ACTIVE` | May claim tasks |
| `INACTIVE` | No recent activity |
| `ON_HOLD` | Temporary pause (travel, etc.) |
| `SUSPENDED` | Cannot claim tasks (reliability or incident) |
| `RETIRED` | Voluntary exit |

**Volunteer task assignment:**

| Status | Meaning |
|--------|---------|
| `OFFERED` | Task visible or sent to volunteer |
| `ACCEPTED` | Volunteer committed |
| `DECLINED` | Volunteer passed |
| `COMPLETED` | Task done; hours logged |
| `CANCELLED_BY_VOLUNTEER` | Released before execution |
| `NO_SHOW` | Failed to execute accepted task |

---

## Workflow 8: Storage Exception Workflow

### Purpose

Handle the rare cases where direct transfer cannot occur immediately—while reinforcing that Sleepwell is **not** a warehouse operation.

### Actors

| Actor | Role |
|-------|------|
| **Administrator** | Approves storage exception, documents justification, monitors duration |
| **Donor** | Agrees to release item to temporary holding (or item already in partner space) |
| **Volunteer** | May transport item to/from storage location |
| **Storage Partner** | Church, partner org, or contracted minimal storage (not Sleepwell warehouse by default) |

### When Storage Is Allowed

Storage requires **documented justification** meeting at least one criterion:

| Allowed | Example |
|---------|---------|
| Recipient housing not ready yet | Move-in delayed 5 days; matched item cannot wait at donor home |
| Geographic mismatch temporarily unresolved | Right recipient identified but delivery volunteer not available for 10 days |
| Donor must vacate property before recipient can receive | Estate timeline forces early removal |
| Multi-item set assembly | Waiting for matching mattress to complete bed set before delivery |
| Weather or access emergency | Recipient home temporarily uninhabitable |

### When Storage Is NOT Allowed

| Not Allowed | Correct Path |
|-------------|--------------|
| "We have warehouse space" | Reject; find direct transfer or decline donation |
| Item not yet matched | Donor keeps item until matched |
| Convenience for staff scheduling | Reschedule pickup/delivery instead |
| Building inventory for future unknown needs | Violates mission; reject intake |
| Donor unwilling to hold but no recipient | Decline or find immediate alternative recipient |

### Step-by-Step Process

```
Transfer Blocked         Administrator           Storage Location
      │                       │                        │
      │── Exception request ─►│                        │
      │   (reason, duration)  │                        │
      │                       │── Six Questions check  │
      │                       │── Approve / deny       │
      │                       │                        │
      │                       │── If approved ────────►│
      │                       │   Schedule intake to   │
      │                       │   partner storage      │
      │                       │                        │
      │                       │── Monitor duration ───►│
      │                       │   (alerts at 50%, 80%, │
      │                       │    100% of max)        │
      │                       │                        │
      │                       │── Reassign to transfer ►│ Workflow 5 or 6
      │                       │   when path clears     │
```

1. **Exception requested** — administrator or system flags blocked direct transfer.
2. **Justification documented** — reason, expected duration, exit strategy.
3. **Leadership approval** — required if duration >14 days or cost incurred.
4. **Item moved to storage** — volunteer or partner transport; condition photo at intake.
5. **Duration monitored** — automated alerts; weekly administrator review of all stored items.
6. **Reassignment** — item returns to `AVAILABLE` in matching pool or proceeds to scheduled transfer.
7. **Exit** — item leaves storage only to recipient (or back to donor if match fails).

### Storage Limits (Default Policy)

| Parameter | Default Limit |
|-----------|---------------|
| Maximum duration without extension | 14 days |
| Extension | Requires re-approval; max 14 additional days |
| Cost threshold | Any paid storage requires board-noted exception |
| Volume cap | Organization tracks % of matches using storage; target <10% |

### Decision Tree

```
Direct transfer possible?
         │
    Yes ─┴─ No
     │       │
     │       ▼
     │  ┌─────────────────┐
     │  │ Valid exception │
     │  │ reason exists?  │
     │  └────────┬────────┘
     │       No ─┴─ Yes
     │       │       │
     │       ▼       ▼
     │   DECLINE   APPROVE
     │   donation  STORAGE
     │   or wait   (documented)
     │   for match
     ▼
  DIRECT
  TRANSFER
  (Workflow 5 or 6)
```

### Success Criteria

- 100% of stored items have documented justification and exit strategy
- Zero items in storage without active match or approved exception
- Average storage duration under 7 days
- Storage utilization under 10% of completed transfers
- Monthly storage exception report to leadership

### Status Definitions

| Status | Meaning |
|--------|---------|
| `EXCEPTION_REQUESTED` | Storage need identified |
| `EXCEPTION_APPROVED` | Justification accepted |
| `EXCEPTION_DENIED` | Must use direct transfer or decline |
| `IN_STORAGE` | Item at holding location |
| `STORAGE_EXPIRING` | Within 48h of max duration |
| `RELEASED_TO_TRANSFER` | Leaving storage for pickup/delivery |
| `STORAGE_EXIT_COMPLETE` | Item no longer in storage |
| `STORAGE_FAILED` | Item damaged, lost, or abandoned in storage |

---

## Workflow 9: Donor Impact Workflow

### Purpose

Close the loop with donors so generosity feels meaningful—driving retention, repeat donations, and community engagement without exploiting recipient stories.

### Actors

| Actor | Role |
|-------|------|
| **Donor** | Receives gratitude, impact summary, tax documentation |
| **Recipient** | Optional: shares anonymous or approved message |
| **Administrator** | Compiles impact, sends communications, generates receipts |
| **System** | Triggers workflow on transfer confirmation |

### Trigger

- Transfer confirmed complete (pickup or delivery)
- Batch end-of-month impact summaries for active donors
- Donor requests tax receipt or impact history

### Step-by-Step Process

1. **Donation completed** — match closed with confirmation timestamp.
2. **Impact recorded** — item category, general outcome (e.g., "bed delivered to family entering stable housing"), geography (city level), date.
3. **Thank-you communication** — personalized message within 48 hours; genuine gratitude, not form-letter tone.
4. **Tax receipt generated** — for applicable donations per nonprofit policy; annual summary available.
5. **Impact story shared** — only with recipient consent; anonymous by default.

### Anonymous Impact Reporting (Default)

| Included | Not Included (without explicit consent) |
|----------|----------------------------------------|
| Item type donated | Recipient name |
| Date of transfer | Recipient address |
| General outcome statement | Photos of recipient home |
| "A neighbor in [city]" | Partner organization name |
| Optional recipient quote (approved) | Detailed personal history |

### Repeat Donor Identification

Signals tracked for relationship building:

- Second donation within 12 months
- Multiple items in single year
- Referral of other donors
- Volunteer crossover (donor who also volunteers)

Repeat donors receive streamlined intake (known profile) and priority thank-you recognition—not priority matching over recipients.

### Decision Points

```
Transfer Complete
       │
       ▼
┌──────────────┐
│ Impact data  │
│ captured?    │
└──────┬───────┘
   No  │  Yes
   ▼   │
 Fix   ▼
 data  ┌──────────────┐
       │ Recipient    │
       │ story consent?│
       └──────┬───────┘
          No  │  Yes
           ▼  │  ▼
      Anonymous  Enriched
      impact     impact
      message    (approved
                 details)
           │  │
           └──┴──► Thank-you + tax receipt
```

### Success Criteria

- Thank-you sent within 48 hours of confirmed transfer
- 100% of completed donations have impact record
- Tax receipts accurate and available on request
- Donor repeat rate tracked and improving year over year
- Zero recipient privacy violations in impact communications

### Status Definitions

| Status | Meaning |
|--------|---------|
| `PENDING_IMPACT` | Transfer complete; impact not yet recorded |
| `IMPACT_RECORDED` | Outcome documented |
| `THANKYOU_SENT` | Gratitude communication delivered |
| `RECEIPT_ISSUED` | Tax documentation generated |
| `STORY_APPROVED` | Recipient consented to shared detail |
| `STORY_SHARED` | Enriched impact sent to donor |
| `CLOSED` | Donor impact cycle complete |

---

## Workflow 10: Exception Management

### Purpose

Handle unusual, high-risk, or failure situations consistently—protecting recipients, donors, volunteers, and organizational integrity without derailing standard workflows.

### Actors

| Actor | Role |
|-------|------|
| **Administrator** | Investigates, documents, resolves, escalates |
| **Leadership** | Reviews fraud, safety, legal, and policy exceptions |
| **Partner** | Supports recipient issues, housing verification disputes |
| **All parties** | May report incidents or concerns |

### Trigger

- Any workflow flags failure, dispute, or safety concern
- Fraud suspicion
- Volunteer or recipient incident report
- Item safety issue discovered at any stage

### Exception Categories and Handling

#### Fraud Prevention

| Scenario | Response |
|----------|----------|
| Suspected false housing claim | Pause request; partner verification required; leadership if confirmed |
| Duplicate identity across requests | Merge or suspend; investigate intent |
| Donor harvesting items for resale | Remove from network; document; report if criminal |
| Partner referring unqualified clients repeatedly | Partner probation workflow |

#### Unsafe Items

| Scenario | Response |
|----------|----------|
| Item fails safety standard at review | Reject with explanation |
| Hazard discovered at pickup | Do not transfer; reject listing; educate donor |
| Recalled product | Reject; notify donor of recall |

#### Damaged Items

| Scenario | Response |
|----------|----------|
| Misrepresented condition | Recipient declines; donor warned; repeat → suspension |
| Damage during volunteer transport | Document; apologize to recipient; prioritize replacement match |
| Damage in unauthorized storage | Storage partner review; insurance claim if applicable |

#### Volunteer Incidents

| Scenario | Response |
|----------|----------|
| Injury during task | Immediate medical priority; incident report; insurance notification |
| Conduct concern | Suspend volunteer; investigate; recipient support |
| Property damage at donor or recipient home | Document; liability process; leadership review |

#### Failed Deliveries / Pickups

| Scenario | Response |
|----------|----------|
| See Workflows 5 and 6 | Reschedule → re-match → exception escalation |
| Repeated failures for same match | Administrator assigns white-glove coordination or paid exception |

#### Recipient Unresponsiveness

| Scenario | Response |
|----------|----------|
| No response to scheduling | 3 attempts over 7 days; partner engaged |
| Continued unresponsiveness | Request `ON_HOLD`; release reserved items after 14 days |

#### Donor Withdrawal

| Scenario | Response |
|----------|----------|
| Before match | Item `WITHDRAWN`; no action needed |
| After match approved | Notify recipient and partner immediately; re-match priority |
| After pickup scheduled | Urgent recipient recovery; donor reliability noted |

#### Duplicate Requests

| Scenario | Response |
|----------|----------|
| Same recipient, same items | Merge requests |
| Same donor, same item | Merge listings |
| Fraudulent duplicate | Exception investigation |

### Exception Queue Process

```
┌─────────────────┐
│ Exception       │
│ reported        │
└────────┬────────┘
         │
┌────────▼────────┐
│ Severity        │
│ classification  │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ▼         ▼            ▼            ▼
 LOW      MEDIUM        HIGH       CRITICAL
 (48h)    (24h)         (4h)       (immediate)
    │         │            │            │
    └────┬────┴────────────┴────────────┘
         ▼
┌─────────────────┐
│ Investigate     │
│ Document        │
│ Resolve         │
│ Close loop      │
└─────────────────┘
```

### Success Criteria

- 100% of exceptions logged with category, severity, resolution
- Critical exceptions acknowledged within 1 hour
- Resolution communicated to affected parties
- Monthly exception review for pattern detection
- Fraud and safety patterns feed back into intake rules

### Status Definitions

| Status | Meaning |
|--------|---------|
| `OPEN` | Exception reported; not yet assigned |
| `ASSIGNED` | Administrator investigating |
| `ESCALATED` | Leadership or legal involved |
| `PENDING_PARTNER` | Awaiting partner input |
| `PENDING_PARTY` | Awaiting donor/recipient/volunteer |
| `RESOLVED` | Issue handled; outcome documented |
| `CLOSED` | No further action |
| `REFERRED_EXTERNAL` | Law enforcement, insurance, counsel |

---

## Master Transfer Path Decision Tree

Use this tree when a match is approved to select the correct transfer workflow:

```
                    ┌─────────────────────┐
                    │ MATCH APPROVED      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Recipient can pickup  │
                    │ with own transport?   │
                    └──────────┬──────────┘
                          Yes  │  No
              ┌────────────────┼────────────────┐
              ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │ WORKFLOW 5      │               │ Volunteer       │
    │ Direct Pickup   │               │ delivery        │
    │ (PREFERRED)     │               │ available?      │
    └─────────────────┘               └────────┬────────┘
                                          Yes  │  No
                              ┌────────────────┼────────────────┐
                              ▼                                 ▼
                    ┌─────────────────┐               ┌─────────────────┐
                    │ WORKFLOW 6      │               │ Direct transfer │
                    │ Volunteer       │               │ impossible now? │
                    │ Delivery        │               └────────┬────────┘
                    └─────────────────┘                     Yes │ No
                                              ┌─────────────────┼─────────┐
                                              ▼                           ▼
                                    ┌─────────────────┐         ┌─────────────────┐
                                    │ WORKFLOW 8      │         │ WAIT / RESCHEDULE│
                                    │ Storage         │         │ Expand volunteer │
                                    │ Exception       │         │ search           │
                                    └─────────────────┘         └─────────────────┘
```

---

## Workflow Integration Map

How workflows connect in daily operations:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Workflow 1  │     │  Workflow 2  │     │  Workflow 3  │
│  Donor       │     │  Recipient   │     │  Partner     │
│  Submission  │     │  Request     │     │  Referral    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │    AVAILABLE       │    QUEUED          │ CONVERTED
       └──────────┬─────────┴──────────┬─────────┘
                  ▼                    │
         ┌─────────────────┐           │
         │  Workflow 4     │◄──────────┘
         │  Matching       │
         └────────┬────────┘
                  │ APPROVED
                  ▼
         ┌─────────────────┐
         │ Transfer path   │
         │ decision tree   │
         └────────┬────────┘
                  │
     ┌────────────┼────────────┬────────────┐
     ▼            ▼            ▼            │
┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ WF 5    │ │ WF 6    │ │ WF 8    │       │
│ Pickup  │ │ Delivery│ │ Storage │       │
└────┬────┘ └────┬────┘ └────┬────┘       │
     │           │           │            │
     └───────────┴───────────┴────────────┘
                  │ COMPLETE
                  ▼
         ┌─────────────────┐
         │  Workflow 9     │
         │  Donor Impact   │
         └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  Workflow 7     │────►│  Workflow 6     │
│  Volunteer Mgmt │     │  (assigns labor)│
└─────────────────┘     └─────────────────┘

┌─────────────────┐
│  Workflow 10    │◄── Any workflow may escalate
│  Exceptions     │
└─────────────────┘
```

---

## Operational Roles Summary

| Role | Primary Workflows | Core Responsibility |
|------|-------------------|---------------------|
| Donor | 1, 5, 9 | Supply resources; participate in direct transfer |
| Recipient | 2, 5, 6 | Express needs; confirm receipt |
| Community Partner | 2, 3, 10 | Verify need; refer clients; support edge cases |
| Volunteer | 6, 7 | Provide labor and transport |
| Administrator | All | Coordinate, approve, escalate, protect mission |
| Leadership | 8, 10 | Policy exceptions, fraud, safety, storage approval |

---

## Metrics Dashboard (Operational)

Track monthly to ensure workflows stay aligned with mission:

| Metric | Target (Pilot) | Workflow Source |
|--------|----------------|-----------------|
| Median days: request → first transfer | <14 | 2, 4, 5, 6 |
| % transfers via direct pickup | >40% | 5 |
| % transfers using storage | <10% | 8 |
| % deliveries via volunteers | >70% | 6, 7 |
| Donor submission review time | <48h | 1 |
| Partner referral approval time | <48h | 3 |
| Match approval → scheduled transfer | <5 days | 4, 5, 6 |
| Thank-you sent within 48h of transfer | 100% | 9 |
| Open exceptions past SLA | 0 critical | 10 |
| Donor repeat rate (12 months) | Increasing | 9 |

---

## Document Governance

This workflow architecture should be reviewed:

- **Quarterly** — against operational data and exception patterns
- **Before major software releases** — ensure product matches operations
- **When adding new resource types** — extend workflows, do not duplicate
- **Annually** — full alignment review with [Constitution](constitution.md)

Amendments require documented rationale evaluated against the six decision questions in the Constitution.

---

*This document describes how Sleepwell operates. Software should serve these workflows—not redefine them.*
