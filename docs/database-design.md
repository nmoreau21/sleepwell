# Sleepwell Database Design

**Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Master Data Model Reference

---

## About This Document

This document defines the data model for the Sleepwell platform—translating the [Constitution](constitution.md), [Roadmap](roadmap.md), and [Workflows](workflows.md) into a practical database structure that supports the MVP and scales over time.

Sleepwell is a nonprofit resource coordination network connecting furniture donors, recipients, volunteers, community partners, and administrators. The database models **coordination and transfer**, not warehouse inventory.

**Guiding principle:**

> Whenever possible, resources move directly from donor to recipient.

**Related documents:**

- [Constitution](constitution.md) — mission guardrails and operational philosophy
- [Roadmap](roadmap.md) — phased feature development
- [Workflows](workflows.md) — operational status definitions and process rules
- [Mission](mission.md) — (planned; inferred from Constitution Article I)
- [Operating Model](operating-model.md) — (planned)
- [User Types](user-types.md) — (planned; inferred from Constitution Article IX)

---

## 1. Database Philosophy

### Design Principles

| Principle | Database Implication |
|-----------|-------------------|
| **Start simple** | MVP uses a small table set with embedded location fields; normalize geography and volunteers in later phases |
| **Normalize core entities** | People, organizations, items, requests, matches, and transfers are separate tables—not one giant spreadsheet row |
| **Clear status fields** | Every lifecycle object has a single `status` column using documented enums aligned with [Workflows](workflows.md) |
| **Preserve audit history** | `audit_log` records approvals, overrides, and status changes; soft deletes preferred over hard deletes |
| **Support direct-transfer matching** | Items are donor-held until transfer; no default `warehouse_location_id` on items |
| **Not warehouse-centric** | Storage is modeled as an exception table linked to items, not as primary inventory location |
| **Future resource types** | MVP uses `furniture_items`; schema evolves toward generic `resource_items` with `resource_type` |
| **Human-in-the-loop** | Match scores and suggestions are stored; administrator approval is always recorded |
| **Privacy by default** | Exact addresses stored with access controls; display locations for matching without exposing PII |
| **Defer automation** | Manual coordinator workflows are fully supported before matching engine tables are required |

### What the Database Is Not

- A warehouse management system (WMS)
- A generic CRM replacing partner relationships
- A payment or marketplace ledger (donations are gifts, not purchases)

### Technology Assumptions (Non-Binding)

- **Primary database:** PostgreSQL 15+
- **IDs:** UUID primary keys for distributed safety and merge-friendly imports
- **Timestamps:** `timestamptz` with `created_at` / `updated_at` on all core tables
- **Enums:** PostgreSQL `ENUM` or `TEXT` with check constraints; enums documented here regardless of implementation

---

## 2. Core Entities

### Entity Overview

```
users ─────┬──── user_roles ──── roles
           │
           ├──── donor_profiles
           ├──── recipient_profiles
           ├──── volunteer_profiles
           └──── partner_users ──── partner_organizations

partner_organizations ──── partner_referrals ──── recipient_requests
                                                    │
                                                    ├── request_need_lines
                                                    │
donor_profiles ──── furniture_items ──── matches ───┤
                           │              │
                           │              └── transfers ─── volunteer_assignments
                           │
                           └── storage_records ─── storage_locations

matches / transfers ──── impact_records
donor_profiles ───────── tax_receipts

users / all entities ─── communications
all entities ─────────── audit_log
all entities ─────────── exceptions
```

### Table Index

| Table | Purpose |
|-------|---------|
| `users` | All people in the system |
| `roles` | Reference: donor, recipient, volunteer, partner_user, admin |
| `user_roles` | Many-to-many: users can hold multiple roles |
| `donor_profiles` | Donor-specific profile and preferences |
| `recipient_profiles` | Recipient-specific profile and housing context |
| `volunteer_profiles` | Volunteer skills, vehicle, reliability |
| `partner_organizations` | Trusted referring organizations |
| `partner_users` | Staff users linked to partner organizations |
| `partner_referrals` | Partner-submitted client referrals |
| `furniture_items` | Donated furniture listings (donor-held) |
| `item_photos` | Photos attached to furniture items |
| `recipient_requests` | Recipient household furnishing requests |
| `request_need_lines` | Individual line items within a request (bed, table, etc.) |
| `matches` | Pairing of item to need line with approval lifecycle |
| `match_candidates` | Ranked suggestions before approval (Phase 2+) |
| `transfers` | Pickup or delivery execution events |
| `volunteer_assignments` | Volunteer linked to a transfer/delivery task |
| `volunteer_availability` | Recurring availability windows |
| `storage_locations` | Exception storage sites (partner church, etc.) |
| `storage_records` | Item temporarily held outside donor/recipient path |
| `impact_records` | Donor impact and outcome summaries |
| `tax_receipts` | Donation acknowledgment documentation |
| `communications` | Email, SMS, phone contact log |
| `audit_log` | Immutable record of significant system events |
| `exceptions` | Incident, fraud, dispute, and failure tracking |
| `locations` | Normalized addresses with geocoding (Phase 2+) |

---

## 3. Field Definitions

### `users`

**Purpose:** Canonical record for every person in the network.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | `a1b2...` | Primary key |
| `email` | TEXT | Optional* | `jane@example.com` | *Required for self-service accounts; optional for coordinator-created records |
| `phone` | TEXT | Optional | `+1-555-0100` | Primary contact; low-tech pathway |
| `first_name` | TEXT | Yes | `Jane` | |
| `last_name` | TEXT | Yes | `Rivera` | |
| `preferred_name` | TEXT | Optional | `Janey` | |
| `status` | TEXT | Yes | `active` | `active`, `inactive`, `suspended` |
| `communication_preference` | TEXT | Optional | `sms` | `email`, `sms`, `phone`, `partner_mediated` |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |
| `deleted_at` | TIMESTAMPTZ | Optional | | Soft delete |

**Relationships:** One user → many roles; one optional profile per role type.

---

### `roles`

**Purpose:** Reference table for system roles.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | SMALLINT | Yes | `1` | |
| `code` | TEXT | Yes | `donor` | Unique: `donor`, `recipient`, `volunteer`, `partner_user`, `admin` |
| `name` | TEXT | Yes | `Donor` | Display name |
| `description` | TEXT | Optional | | |

---

### `user_roles`

**Purpose:** Assign one or more roles to a user.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `user_id` | UUID | Yes | | FK → `users` |
| `role_id` | SMALLINT | Yes | | FK → `roles` |
| `granted_at` | TIMESTAMPTZ | Yes | | |
| `granted_by_user_id` | UUID | Optional | | FK → `users` (admin) |
| `revoked_at` | TIMESTAMPTZ | Optional | | |

**Constraints:** Unique active (`user_id`, `role_id`) where `revoked_at IS NULL`.

---

### `donor_profiles`

**Purpose:** Donor-specific attributes beyond base user record.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `user_id` | UUID | Yes | | FK → `users`, unique |
| `donor_type` | TEXT | Optional | `individual` | `individual`, `business`, `church`, `estate` |
| `anonymous_impact_ok` | BOOLEAN | Yes | `true` | Default anonymous impact reporting |
| `pickup_privacy_level` | TEXT | Yes | `exact` | `exact`, `cross_street`, `meet_point` |
| `notes` | TEXT | Optional | | Coordinator notes |
| `repeat_donor` | BOOLEAN | Yes | `false` | Derived or flagged for engagement |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `recipient_profiles`

**Purpose:** Recipient housing and household context.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `user_id` | UUID | Yes | | FK → `users`, unique |
| `household_size` | SMALLINT | Optional | `4` | Used in matching |
| `has_vehicle` | BOOLEAN | Optional | `false` | Pickup capability |
| `can_pickup_large_items` | BOOLEAN | Optional | `false` | |
| `needs_delivery` | BOOLEAN | Yes | `true` | Default until assessed |
| `access_notes` | TEXT | Optional | `3rd floor, no elevator` | Stairs, parking |
| `housing_verified` | BOOLEAN | Yes | `false` | Partner or admin verified |
| `housing_verified_at` | TIMESTAMPTZ | Optional | | |
| `housing_verified_by_user_id` | UUID | Optional | | FK → `users` |
| `primary_partner_org_id` | UUID | Optional | | FK → `partner_organizations` |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `volunteer_profiles`

**Purpose:** Volunteer capabilities, vehicle, and reliability (Phase 2+ full use; MVP optional).

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `user_id` | UUID | Yes | | FK → `users`, unique |
| `status` | TEXT | Yes | `active` | See Volunteer status section |
| `has_truck` | BOOLEAN | Yes | `true` | |
| `has_trailer` | BOOLEAN | Yes | `false` | |
| `truck_bed_length_in` | SMALLINT | Optional | `96` | Inches |
| `can_move_furniture` | BOOLEAN | Yes | `true` | |
| `can_assemble` | BOOLEAN | Yes | `false` | |
| `weekend_available` | BOOLEAN | Yes | `true` | |
| `weekday_available` | BOOLEAN | Yes | `false` | |
| `emergency_response_ok` | BOOLEAN | Yes | `false` | |
| `reliability_score` | NUMERIC(4,2) | Optional | `4.50` | 0–5 scale; admin-visible |
| `waiver_signed_at` | TIMESTAMPTZ | Optional | | |
| `completed_task_count` | INTEGER | Yes | `12` | Denormalized counter |
| `no_show_count` | INTEGER | Yes | `0` | |
| `notes` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `volunteer_availability`

**Purpose:** Recurring scheduling windows for volunteer matching.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `volunteer_profile_id` | UUID | Yes | | FK → `volunteer_profiles` |
| `day_of_week` | SMALLINT | Optional | `6` | 0=Sunday; null if date-specific |
| `start_time` | TIME | Yes | `09:00` | Local time |
| `end_time` | TIME | Yes | `17:00` | |
| `specific_date` | DATE | Optional | `2026-06-15` | Blackout or one-off availability |
| `is_blackout` | BOOLEAN | Yes | `false` | True = unavailable |
| `created_at` | TIMESTAMPTZ | Yes | | |

---

### `partner_organizations`

**Purpose:** Trusted organizations that refer recipients.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `name` | TEXT | Yes | `Hope Recovery Center` | |
| `org_type` | TEXT | Yes | `rehab_center` | See org types below |
| `status` | TEXT | Yes | `active` | See Partner status section |
| `referral_code` | TEXT | Yes | `HOPE-2026` | Unique intake code |
| `priority_tier` | SMALLINT | Yes | `2` | 1=highest; used in matching |
| `service_area_zip_codes` | TEXT[] | Optional | `{90210,90211}` | Pilot geography |
| `primary_contact_name` | TEXT | Optional | | |
| `primary_contact_email` | TEXT | Optional | | |
| `primary_contact_phone` | TEXT | Optional | | |
| `address_line1` | TEXT | Optional | | Org headquarters |
| `city` | TEXT | Optional | `Los Angeles` | |
| `state` | TEXT | Optional | `CA` | |
| `zip_code` | TEXT | Optional | `90001` | |
| `referral_quality_score` | NUMERIC(4,2) | Optional | `4.20` | Operational metric |
| `agreement_signed_at` | TIMESTAMPTZ | Optional | | |
| `notes` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

**Org types:** `rehab_center`, `sober_living`, `reentry_program`, `church`, `social_services`, `veterans_services`, `housing_program`, `other`.

---

### `partner_users`

**Purpose:** Link partner staff users to organizations.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `user_id` | UUID | Yes | | FK → `users` |
| `partner_organization_id` | UUID | Yes | | FK → `partner_organizations` |
| `job_title` | TEXT | Optional | `Case Manager` | |
| `is_primary_contact` | BOOLEAN | Yes | `false` | |
| `created_at` | TIMESTAMPTZ | Yes | | |

---

### `partner_referrals`

**Purpose:** Partner-submitted referral before or alongside recipient request.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `partner_organization_id` | UUID | Yes | | FK → `partner_organizations` |
| `submitted_by_user_id` | UUID | Optional | | FK → `users` (partner user) |
| `recipient_profile_id` | UUID | Optional | | FK → `recipient_profiles`; set after client created |
| `recipient_request_id` | UUID | Optional | | FK → `recipient_requests`; set when converted |
| `status` | TEXT | Yes | `submitted` | See Referral status section |
| `client_first_name` | TEXT | Yes | `Maria` | Minimal PII at intake |
| `client_last_name` | TEXT | Yes | `Lopez` | |
| `client_phone` | TEXT | Optional | | |
| `move_in_date` | DATE | Optional | `2026-06-20` | |
| `urgency` | TEXT | Yes | `standard` | `emergency`, `urgent`, `standard` |
| `housing_confirmed` | BOOLEAN | Yes | `true` | |
| `notes` | TEXT | Optional | | Partner notes; avoid excess PII |
| `reviewed_by_user_id` | UUID | Optional | | FK → `users` |
| `reviewed_at` | TIMESTAMPTZ | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `furniture_items`

**Purpose:** Donated furniture listing held by donor until direct transfer (not warehouse inventory).

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `donor_profile_id` | UUID | Yes | | FK → `donor_profiles` |
| `status` | TEXT | Yes | `submitted` | See Furniture item status section |
| `category` | TEXT | Yes | `bed` | Taxonomy: bed, dresser, table, couch, etc. |
| `title` | TEXT | Optional | `Queen bed frame` | Short label |
| `description` | TEXT | Optional | | |
| `condition` | TEXT | Yes | `good` | `excellent`, `good`, `fair`, `poor` |
| `quantity` | SMALLINT | Yes | `1` | |
| `width_in` | SMALLINT | Optional | `60` | Inches |
| `depth_in` | SMALLINT | Optional | `80` | |
| `height_in` | SMALLINT | Optional | `40` | |
| `weight_lbs` | SMALLINT | Optional | `120` | |
| `requires_disassembly` | BOOLEAN | Yes | `false` | |
| `requires_two_person` | BOOLEAN | Yes | `true` | |
| `pickup_constraints` | TEXT | Optional | `Stairs to 2nd floor` | |
| `availability_start` | DATE | Optional | `2026-06-10` | |
| `availability_end` | DATE | Optional | `2026-07-10` | Listing expiration |
| `available_notes` | TEXT | Optional | | Conditional acceptance notes |
| `rejection_reason` | TEXT | Optional | | If `rejected` |
| `reviewed_by_user_id` | UUID | Optional | | FK → `users` |
| `reviewed_at` | TIMESTAMPTZ | Optional | | |
| `address_line1` | TEXT | Optional | | Donor pickup address |
| `address_line2` | TEXT | Optional | | |
| `cross_street` | TEXT | Optional | `Main & 5th` | Privacy-safe display |
| `city` | TEXT | Yes | `Los Angeles` | |
| `state` | TEXT | Yes | `CA` | |
| `zip_code` | TEXT | Yes | `90012` | Primary geo signal for MVP |
| `latitude` | NUMERIC(9,6) | Optional | `34.052235` | Phase 2 geocoding |
| `longitude` | NUMERIC(9,6) | Optional | `-118.243683` | |
| `display_location` | TEXT | Optional | `Downtown LA` | Privacy-safe label |
| `location_privacy_level` | TEXT | Yes | `zip_only` | `exact`, `cross_street`, `zip_only` |
| `duplicate_of_item_id` | UUID | Optional | | FK → `furniture_items` |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |
| `deleted_at` | TIMESTAMPTZ | Optional | | Soft delete / withdrawal |

**Note:** No `warehouse_location_id` by default. Storage is tracked via `storage_records`.

---

### `item_photos`

**Purpose:** Photos for furniture items.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `furniture_item_id` | UUID | Yes | | FK → `furniture_items` |
| `url` | TEXT | Yes | `https://...` | Object storage URL |
| `sort_order` | SMALLINT | Yes | `1` | |
| `is_primary` | BOOLEAN | Yes | `true` | |
| `uploaded_at` | TIMESTAMPTZ | Yes | | |

---

### `recipient_requests`

**Purpose:** Household-level request for furnishing support.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `recipient_profile_id` | UUID | Yes | | FK → `recipient_profiles` |
| `partner_organization_id` | UUID | Optional | | FK → `partner_organizations` |
| `partner_referral_id` | UUID | Optional | | FK → `partner_referrals` |
| `status` | TEXT | Yes | `submitted` | See Recipient request status section |
| `priority` | TEXT | Yes | `standard` | `emergency`, `urgent`, `standard` |
| `move_in_date` | DATE | Optional | `2026-06-20` | Urgency signal |
| `housing_address_line1` | TEXT | Optional | | Recipient delivery address |
| `address_line2` | TEXT | Optional | | |
| `city` | TEXT | Yes | `Los Angeles` | |
| `state` | TEXT | Yes | `CA` | |
| `zip_code` | TEXT | Yes | `90015` | |
| `latitude` | NUMERIC(9,6) | Optional | | |
| `longitude` | NUMERIC(9,6) | Optional | | |
| `display_location` | TEXT | Optional | | |
| `access_notes` | TEXT | Optional | | |
| `needs_delivery` | BOOLEAN | Yes | `true` | |
| `submitted_by_user_id` | UUID | Optional | | Partner user or recipient |
| `reviewed_by_user_id` | UUID | Optional | | FK → `users` |
| `reviewed_at` | TIMESTAMPTZ | Optional | | |
| `approved_at` | TIMESTAMPTZ | Optional | | |
| `expires_at` | TIMESTAMPTZ | Optional | | Default 60 days open |
| `closed_reason` | TEXT | Optional | | |
| `notes` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `request_need_lines`

**Purpose:** Individual item needs within a request (enables partial matching).

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `recipient_request_id` | UUID | Yes | | FK → `recipient_requests` |
| `category` | TEXT | Yes | `bed` | Must align with item taxonomy |
| `essential` | BOOLEAN | Yes | `true` | Essential vs optional need |
| `quantity_needed` | SMALLINT | Yes | `1` | |
| `quantity_matched` | SMALLINT | Yes | `0` | Updated on match completion |
| `status` | TEXT | Yes | `open` | `open`, `matched`, `fulfilled`, `cancelled` |
| `size_preference` | TEXT | Optional | `queen` | e.g. twin, full, queen |
| `notes` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `matches`

**Purpose:** Approved or pending pairing of one furniture item to one need line.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `furniture_item_id` | UUID | Yes | | FK → `furniture_items` |
| `request_need_line_id` | UUID | Yes | | FK → `request_need_lines` |
| `recipient_request_id` | UUID | Yes | | FK → `recipient_requests`; denormalized for queries |
| `status` | TEXT | Yes | `pending_review` | See Match status section |
| `transfer_method` | TEXT | Optional | `pickup` | `pickup`, `volunteer_delivery`, `storage_then_transfer` |
| `match_score` | NUMERIC(5,2) | Optional | `87.50` | Total score 0–100 |
| `distance_score` | NUMERIC(5,2) | Optional | `92.00` | |
| `urgency_score` | NUMERIC(5,2) | Optional | `80.00` | |
| `category_match_score` | NUMERIC(5,2) | Optional | `100.00` | |
| `priority_score` | NUMERIC(5,2) | Optional | `75.00` | Partner tier + request priority |
| `delivery_fit_score` | NUMERIC(5,2) | Optional | `70.00` | |
| `score_explanation` | JSONB | Optional | `{"distance_miles": 4.2}` | Human-readable factors |
| `is_override` | BOOLEAN | Yes | `false` | Admin chose non-top suggestion |
| `override_reason` | TEXT | Optional | | Required if `is_override` |
| `approved_by_user_id` | UUID | Optional | | FK → `users` |
| `approved_at` | TIMESTAMPTZ | Optional | | |
| `rejected_by_party` | TEXT | Optional | `recipient` | `donor`, `recipient`, `admin` |
| `rejection_reason` | TEXT | Optional | | |
| `expires_at` | TIMESTAMPTZ | Optional | | 7 days after approval if not scheduled |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

**Constraint:** One active match per item (status not in `completed`, `cancelled`, `match_rejected`, `match_expired`).

---

### `match_candidates` (Phase 2+)

**Purpose:** Ranked suggestions generated before human approval.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `furniture_item_id` | UUID | Yes | | FK → `furniture_items` |
| `request_need_line_id` | UUID | Yes | | FK → `request_need_lines` |
| `rank` | SMALLINT | Yes | `1` | |
| `match_score` | NUMERIC(5,2) | Yes | `87.50` | |
| `score_breakdown` | JSONB | Optional | | |
| `generated_at` | TIMESTAMPTZ | Yes | | |
| `selected` | BOOLEAN | Yes | `false` | True if became approved match |
| `match_id` | UUID | Optional | | FK → `matches` if selected |

---

### `transfers`

**Purpose:** Execution of physical movement—pickup or delivery.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `match_id` | UUID | Yes | | FK → `matches` |
| `transfer_type` | TEXT | Yes | `pickup` | `pickup`, `volunteer_delivery` |
| `status` | TEXT | Yes | `pending` | See Transfer status section |
| `scheduled_at` | TIMESTAMPTZ | Optional | | Confirmed date/time |
| `completed_at` | TIMESTAMPTZ | Optional | | |
| `pickup_address` | TEXT | Optional | | Snapshot at schedule time |
| `delivery_address` | TEXT | Optional | | Recipient address snapshot |
| `meet_point_address` | TEXT | Optional | | Neutral location if used |
| `reschedule_count` | SMALLINT | Yes | `0` | Max 2 per workflow |
| `failure_reason` | TEXT | Optional | | |
| `dispute_notes` | TEXT | Optional | | |
| `confirmed_by_user_id` | UUID | Optional | | Who confirmed completion |
| `confirmed_by_role` | TEXT | Optional | `recipient` | `donor`, `recipient`, `volunteer`, `admin` |
| `scheduled_by_user_id` | UUID | Optional | | FK → `users` |
| `notes` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `volunteer_assignments`

**Purpose:** Volunteer committed to a delivery transfer.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `transfer_id` | UUID | Yes | | FK → `transfers` |
| `volunteer_profile_id` | UUID | Yes | | FK → `volunteer_profiles` |
| `role` | TEXT | Yes | `driver` | `driver`, `helper`, `lead` |
| `status` | TEXT | Yes | `offered` | See Volunteer assignment status |
| `hours_logged` | NUMERIC(4,2) | Optional | `3.50` | |
| `miles_logged` | NUMERIC(6,2) | Optional | `12.00` | |
| `accepted_at` | TIMESTAMPTZ | Optional | | |
| `completed_at` | TIMESTAMPTZ | Optional | | |
| `cancellation_reason` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `storage_locations`

**Purpose:** Approved exception storage sites (not Sleepwell warehouse by default).

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `name` | TEXT | Yes | `Grace Church storage room` | |
| `location_type` | TEXT | Yes | `partner_site` | `partner_site`, `contracted`, `temporary` |
| `partner_organization_id` | UUID | Optional | | FK → `partner_organizations` |
| `address_line1` | TEXT | Yes | | |
| `city` | TEXT | Yes | | |
| `state` | TEXT | Yes | | |
| `zip_code` | TEXT | Yes | | |
| `max_items` | SMALLINT | Optional | `20` | Capacity guardrail |
| `is_active` | BOOLEAN | Yes | `true` | |
| `cost_per_day_cents` | INTEGER | Optional | `0` | Track exception costs |
| `notes` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |

---

### `storage_records`

**Purpose:** Item temporarily held outside direct donor→recipient path.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `furniture_item_id` | UUID | Yes | | FK → `furniture_items` |
| `storage_location_id` | UUID | Yes | | FK → `storage_locations` |
| `match_id` | UUID | Optional | | FK → `matches`; reserved for recipient |
| `status` | TEXT | Yes | `exception_requested` | See Storage status section |
| `justification` | TEXT | Yes | | Required reason |
| `exit_strategy` | TEXT | Yes | | How item leaves storage |
| `approved_by_user_id` | UUID | Optional | | FK → `users` |
| `approved_at` | TIMESTAMPTZ | Optional | | |
| `intake_at` | TIMESTAMPTZ | Optional | | Item arrived at storage |
| `max_duration_days` | SMALLINT | Yes | `14` | Default policy |
| `expires_at` | TIMESTAMPTZ | Optional | | Computed from intake + max duration |
| `released_at` | TIMESTAMPTZ | Optional | | |
| `release_transfer_id` | UUID | Optional | | FK → `transfers` |
| `condition_at_intake` | TEXT | Optional | | |
| `notes` | TEXT | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `impact_records`

**Purpose:** Document outcome for donor impact loop and reporting.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `match_id` | UUID | Yes | | FK → `matches` |
| `transfer_id` | UUID | Optional | | FK → `transfers` |
| `donor_profile_id` | UUID | Yes | | FK → `donor_profiles` |
| `recipient_profile_id` | UUID | Yes | | FK → `recipient_profiles` |
| `status` | TEXT | Yes | `pending_impact` | See Impact status section |
| `item_category` | TEXT | Yes | `bed` | Snapshot |
| `outcome_summary` | TEXT | Yes | `Bed delivered to family entering stable housing` | Anonymous default |
| `recipient_quote` | TEXT | Optional | | Only with consent |
| `story_consent` | BOOLEAN | Yes | `false` | Recipient approved sharing |
| `city` | TEXT | Optional | `Los Angeles` | City-level geography only |
| `thank_you_sent_at` | TIMESTAMPTZ | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

### `tax_receipts`

**Purpose:** Donation acknowledgment for tax documentation.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `donor_profile_id` | UUID | Yes | | FK → `donor_profiles` |
| `impact_record_id` | UUID | Optional | | FK → `impact_records` |
| `furniture_item_id` | UUID | Optional | | FK → `furniture_items` |
| `status` | TEXT | Yes | `pending` | See Tax receipt status section |
| `receipt_number` | TEXT | Yes | `SW-2026-00042` | Unique sequential |
| `donation_date` | DATE | Yes | `2026-06-15` | |
| `description` | TEXT | Yes | `Queen bed frame, good condition` | |
| `fair_market_value_cents` | INTEGER | Optional | `15000` | Donor-provided; not appraised by Sleepwell |
| `issued_at` | TIMESTAMPTZ | Optional | | |
| `document_url` | TEXT | Optional | | PDF storage URL |
| `created_at` | TIMESTAMPTZ | Yes | | |

---

### `communications`

**Purpose:** Log of outbound and inbound contact across channels.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `user_id` | UUID | Optional | | FK → `users` (recipient of comms) |
| `sent_by_user_id` | UUID | Optional | | FK → `users` (admin) |
| `channel` | TEXT | Yes | `email` | `email`, `sms`, `phone`, `in_app` |
| `direction` | TEXT | Yes | `outbound` | `outbound`, `inbound` |
| `template_code` | TEXT | Optional | `match_approved` | |
| `subject` | TEXT | Optional | | |
| `body_preview` | TEXT | Optional | | Truncated; full body in provider |
| `related_entity_type` | TEXT | Optional | `match` | Polymorphic reference |
| `related_entity_id` | UUID | Optional | | |
| `status` | TEXT | Yes | `sent` | `queued`, `sent`, `delivered`, `failed` |
| `provider_message_id` | TEXT | Optional | | External ID |
| `sent_at` | TIMESTAMPTZ | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |

---

### `audit_log`

**Purpose:** Immutable record of significant actions for accountability and tuning.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `actor_user_id` | UUID | Optional | | FK → `users`; null for system |
| `action` | TEXT | Yes | `match.approved` | Dot notation |
| `entity_type` | TEXT | Yes | `match` | |
| `entity_id` | UUID | Yes | | |
| `old_values` | JSONB | Optional | `{"status":"pending_review"}` | |
| `new_values` | JSONB | Optional | `{"status":"approved"}` | |
| `metadata` | JSONB | Optional | | IP, user agent, override reason |
| `created_at` | TIMESTAMPTZ | Yes | | Immutable |

**Never update or delete audit rows.**

---

### `exceptions`

**Purpose:** Incidents, disputes, fraud flags, and operational failures.

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | | |
| `category` | TEXT | Yes | `failed_delivery` | See exception categories |
| `severity` | TEXT | Yes | `medium` | `low`, `medium`, `high`, `critical` |
| `status` | TEXT | Yes | `open` | `open`, `assigned`, `escalated`, `resolved`, `closed` |
| `reported_by_user_id` | UUID | Optional | | FK → `users` |
| `assigned_to_user_id` | UUID | Optional | | FK → `users` |
| `related_entity_type` | TEXT | Optional | `transfer` | |
| `related_entity_id` | UUID | Optional | | |
| `description` | TEXT | Yes | | |
| `resolution` | TEXT | Optional | | |
| `resolved_at` | TIMESTAMPTZ | Optional | | |
| `created_at` | TIMESTAMPTZ | Yes | | |
| `updated_at` | TIMESTAMPTZ | Yes | | |

---

## 4. Status Systems

Statuses use **snake_case** in the database, aligned with [Workflows](workflows.md).

### Furniture Item Statuses

| Status | Workflow Meaning |
|--------|------------------|
| `submitted` | Intake received |
| `incomplete` | Missing photos or required fields |
| `under_review` | Administrator reviewing |
| `approved` | Accepted; transitioning to pool |
| `available` | Eligible for matching |
| `available_conditional` | Available with constraints (time-bound) |
| `match_pending` | Candidate match identified |
| `reserved` | Locked to approved match |
| `transfer_scheduled` | Transfer date set |
| `transferred` | Physical transfer confirmed |
| `rejected` | Not accepted |
| `expired` | Listing timed out |
| `withdrawn` | Donor removed listing |
| `in_storage` | Exception storage path active |

**Typical happy path:** `submitted` → `under_review` → `available` → `reserved` → `transfer_scheduled` → `transferred`

### Recipient Request Statuses

| Status | Workflow Meaning |
|--------|------------------|
| `submitted` | Intake received |
| `pending_verification` | Awaiting housing/need confirmation |
| `incomplete` | Missing required fields |
| `under_review` | Administrator assessing |
| `approved` | Verified; not yet in active queue |
| `queued` | Active in matching queue (aka "waiting") |
| `partially_matched` | Some need lines fulfilled |
| `fully_matched` | All essential needs have approved matches |
| `fulfilled` | All transfers confirmed complete |
| `on_hold` | Paused (unresponsive, housing delay) |
| `cancelled` | Withdrawn by recipient or partner |
| `expired` | Timed out without renewal |
| `closed` | Administratively closed |
| `denied` | Not approved |

### Match Statuses

| Status | Workflow Meaning |
|--------|------------------|
| `unmatched` | Initial / returned to pool |
| `candidates_identified` | Suggestions generated (Phase 2) |
| `pending_review` | Awaiting administrator approval |
| `approved` | Match accepted; transfer not scheduled |
| `reserved` | Resource locked |
| `scheduled` | Transfer date set |
| `completed` | Transfer confirmed |
| `match_rejected` | Party declined |
| `match_expired` | Approval timed out (7 days default) |
| `cancelled` | Dissolved before transfer |

### Transfer Statuses

| Status | Workflow Meaning |
|--------|------------------|
| `pending` | Match approved; scheduling not complete |
| `scheduled` | Date/time confirmed |
| `rescheduled` | New time after conflict |
| `in_transit` | Delivery en route (volunteer path) |
| `completed` | Transfer successful |
| `failed` | Did not occur |
| `disputed` | Condition or conduct issue |
| `cancelled` | Cancelled before completion |

**Pickup-specific aliases** (optional `transfer_subtype` or mapped to above): `pickup_pending`, `pickup_scheduled`, `pickup_complete`, `pickup_failed`.

### Volunteer Assignment Statuses

| Status | Workflow Meaning |
|--------|------------------|
| `offered` | Task visible to volunteer |
| `accepted` | Volunteer committed |
| `declined` | Volunteer passed |
| `cancelled_by_volunteer` | Released before execution |
| `no_show` | Failed to execute accepted task |
| `completed` | Task done; hours logged |

### Volunteer Profile Statuses

| Status | Meaning |
|--------|---------|
| `registered` | Application received |
| `incomplete` | Missing waiver or profile |
| `active` | May claim tasks |
| `inactive` | No recent activity |
| `on_hold` | Temporary pause |
| `suspended` | Cannot claim tasks |
| `retired` | Voluntary exit |

### Storage Record Statuses

| Status | Workflow Meaning |
|--------|------------------|
| `exception_requested` | Storage need identified |
| `exception_approved` | Justification accepted |
| `exception_denied` | Must use direct transfer |
| `in_storage` | Item at holding location |
| `storage_expiring` | Within 48h of max duration |
| `released_to_transfer` | Leaving storage for pickup/delivery |
| `storage_exit_complete` | Item no longer in storage |
| `storage_failed` | Damaged, lost, or abandoned |

### Tax Receipt Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Transfer complete; receipt not issued |
| `issued` | Document generated and sent |
| `voided` | Cancelled (error correction) |

### Impact Record Statuses

| Status | Meaning |
|--------|---------|
| `pending_impact` | Transfer complete; impact not recorded |
| `impact_recorded` | Outcome documented |
| `thank_you_sent` | Gratitude communication delivered |
| `receipt_issued` | Tax receipt linked |
| `story_approved` | Recipient consented to enriched story |
| `story_shared` | Enriched impact sent to donor |
| `closed` | Cycle complete |

### Partner Organization Statuses

| Status | Meaning |
|--------|---------|
| `applicant` | Application received |
| `under_review` | Review in progress |
| `active` | May submit referrals |
| `probation` | Enhanced review |
| `suspended` | Referrals not accepted |
| `inactive` | Voluntary pause |
| `terminated` | Relationship ended |

### Partner Referral Statuses

| Status | Meaning |
|--------|---------|
| `submitted` | Referral received |
| `under_review` | Processing |
| `accepted` | Linked to recipient profile |
| `returned` | Sent back for missing info |
| `rejected` | Not accepted |
| `converted` | Recipient request approved and queued |
| `fulfilled` | Client needs met |
| `closed` | Closed without full fulfillment |

---

## 5. Relationship Model

### Cardinality Rules

| Relationship | Rule |
|--------------|------|
| User ↔ Roles | Many-to-many via `user_roles`; one user may be donor and volunteer |
| Donor → Items | One donor profile → many `furniture_items` |
| Recipient → Requests | One recipient profile → many `recipient_requests` over time |
| Request → Need lines | One request → many `request_need_lines` |
| Need line → Matches | One need line → many matches over time, but **one active match** at a time |
| Item → Matches | One item → many matches over time, but **one active match** at a time |
| Match → Transfer | One match → one or more transfers (reschedules create history or update same row) |
| Transfer → Volunteers | One delivery transfer → one or more `volunteer_assignments` |
| Partner → Referrals | One partner org → many referrals |
| Partner → Recipients | One partner may refer many recipient profiles |
| Match → Impact | One completed match → one `impact_record` |
| Donor → Tax receipts | One donor → many receipts (per item or annual summary) |

### Active Match Constraint

Only one **active** match per `furniture_item_id` at a time:

```sql
-- Conceptual: partial unique index on furniture_item_id
-- where status NOT IN ('completed', 'cancelled', 'match_rejected', 'match_expired')
```

Same pattern for `request_need_lines` with status not in (`fulfilled`, `cancelled`).

### Transfer Involvement

A single transfer row links:

- `match_id` → item + need line + request
- `volunteer_assignments` → volunteers (delivery only)
- Implicit donor via `furniture_items.donor_profile_id`
- Implicit recipient via `recipient_requests.recipient_profile_id`

### Entity Relationship Diagram (Simplified)

```
partner_organizations 1───* partner_referrals
partner_organizations 1───* partner_users *───1 users
users 1───1 donor_profiles 1───* furniture_items
users 1───1 recipient_profiles 1───* recipient_requests 1───* request_need_lines
furniture_items 1───* matches *───1 request_need_lines
matches 1───* transfers 1───* volunteer_assignments
furniture_items 1───* storage_records *───1 storage_locations
matches 1───1 impact_records
donor_profiles 1───* tax_receipts
```

---

## 6. MVP Schema

### MVP Goal

Support Phase 1 from the [Roadmap](roadmap.md): manual coordination of real donations in a single metro area with coordinator-driven matching, status tracking, and basic communications—**without warehouse inventory as the default model**.

### MVP Tables (Launch)

| Table | MVP Scope |
|-------|-----------|
| `users` | Yes — all actors |
| `roles` + `user_roles` | Yes — minimal role assignment |
| `donor_profiles` | Yes |
| `recipient_profiles` | Yes |
| `partner_organizations` | Yes — with referral codes |
| `partner_referrals` | Yes — partner intake path |
| `furniture_items` | Yes — with embedded location |
| `item_photos` | Yes — at least one photo required for approval |
| `recipient_requests` | Yes |
| `request_need_lines` | Yes — essential for partial matching |
| `matches` | Yes — manual approval; scores optional |
| `transfers` | Yes — pickup and delivery |
| `communications` | Yes — log coordinator outreach |
| `audit_log` | Yes — approvals and status changes |

### MVP Simplifications

- **No `match_candidates` table** — coordinator searches manually; add in Phase 2
- **No `volunteer_profiles` / `volunteer_assignments`** — volunteer name and phone in `transfers.notes` until Phase 5; or minimal volunteer user + notes
- **No `storage_locations` / `storage_records`** — track storage as `furniture_items.status = in_storage` + `exceptions` row until storage workflow is needed
- **No `impact_records` / `tax_receipts`** — coordinator sends thank-you manually; log in `communications` until Phase 4+
- **No `locations` table** — zip and city on items and requests
- **No geocoding** — zip-based proximity only (manual or simple lookup table)
- **Partner users** — optional; partner contact on `partner_organizations` only

### Deferred to Later Phases

| Capability | Phase | Tables Added |
|------------|-------|----------------|
| Match scoring engine | 2 | `match_candidates`, score fields on `matches` |
| User dashboards / auth | 3 | session tables, notification preferences |
| Geocoding / maps | 4 | `locations`, lat/long backfill |
| Volunteer network | 5 | `volunteer_profiles`, `volunteer_availability`, `volunteer_assignments` |
| Partner dashboards | 6 | reporting views, outcome capture fields |
| Donor impact automation | 4+ | `impact_records`, `tax_receipts` |
| Storage exception workflow | When >10% need threatens | `storage_locations`, `storage_records` |
| AI photo classification | 7+ | `item_photos.ai_labels`, confidence scores |
| Multi-city | 8 | `service_areas`, org-level geography |
| Generic resources | Long-term | `resource_items` migration from `furniture_items` |

### MVP Coordinator Flow (Data Touchpoints)

1. Partner referral → `partner_referrals` + `recipient_profiles` + `recipient_requests` + `request_need_lines`
2. Donor submission → `furniture_items` + `item_photos`
3. Admin approves both → status updates + `audit_log`
4. Admin creates `matches` row → approves → `audit_log`
5. Admin creates `transfers` row → schedules → completes
6. Status cascades: item `transferred`, need line `fulfilled`, request `fulfilled`
7. Coordinator logs thank-you in `communications`

---

## 7. Future Schema Expansion

### Phase 2: Automated Matching

- Add `match_candidates` with batch generation on item/request status changes
- Populate score columns on `matches` from engine
- Notification triggers on `communications` from match events
- `audit_log` captures every override for algorithm tuning

### Phase 3: User Accounts & Dashboards

- Auth provider linkage on `users` (`auth_provider_id`)
- `notification_preferences` table per user
- Role-scoped views; row-level security by `user_id` and `partner_organization_id`

### Phase 4: Geography & Routing

- Normalize addresses into `locations` table with PostGIS `geography(POINT)`
- `service_radius_miles` on donor and recipient profiles
- Route optimization via transfer grouping (`transfer_batches`)

### Phase 5: Volunteer Network

- Full `volunteer_profiles`, `volunteer_availability`, `volunteer_assignments`
- `reliability_score` updated by triggers on assignment completion
- `delivery_tasks` view joining open transfers needing volunteers

### Phase 6: Partner Expansion

- Partner outcome fields on `recipient_requests` (30/60/90-day stability flags)
- `partner_reports` materialized views for fulfillment metrics
- API keys for partner integrations (`partner_api_credentials`)

### Phase 7+: Intelligence & Scale

- `item_photos.ai_category`, `ai_condition`, `ai_confidence`
- `resource_items` superset table with `resource_type` enum: `furniture`, `appliance`, `household_goods`
- `service_areas` for multi-metro expansion
- Read replicas and event outbox for notifications

### Migration Principle

Add tables and columns without breaking direct-transfer model. Never add `warehouse_id` as required field on intake.

---

## 8. Geographic Data Strategy

### Fields by Entity

| Field | Donor Item | Recipient Request | Partner Org | Storage Location |
|-------|------------|-------------------|-------------|------------------|
| `address_line1` | Optional* | Optional* | Optional | Required |
| `address_line2` | Optional | Optional | Optional | Optional |
| `cross_street` | Optional | Optional | — | — |
| `city` | Required | Required | Optional | Required |
| `state` | Required | Required | Optional | Required |
| `zip_code` | Required | Required | Optional | Required |
| `latitude` | Phase 2 | Phase 2 | Phase 2 | Phase 2 |
| `longitude` | Phase 2 | Phase 2 | Phase 2 | Phase 2 |
| `display_location` | Optional | Optional | — | — |
| `location_privacy_level` | Required | Required | — | — |
| `service_radius_miles` | Phase 4 | — | — | — |

*Exact address required internally for transfer scheduling but not for public display.

### Privacy Levels

| Level | Stored | Shown to Matchers | Shown After Match Approved |
|-------|--------|-------------------|----------------------------|
| `zip_only` | Zip + city | Zip/city area only | Exact address to coordinator; parties per protocol |
| `cross_street` | Cross street + zip | Approximate area | Exact on schedule |
| `exact` | Full address | Area only until match | Shared per contact protocol |

### Access Rules

- **Volunteers** see pickup/delivery addresses only for accepted assignments
- **Partners** see client city/zip and request status—not donor addresses
- **Donors** see recipient area only after match approval, not full address unless direct contact consented
- **Administrators** see all fields; access logged in `audit_log`

### MVP Proximity Matching

Phase 1: same `zip_code` or adjacent zip list (static lookup table `zip_adjacency`).

Phase 2+: haversine distance on lat/long:

```
distance_score = max(0, 100 - (distance_miles / max_radius_miles) * 100)
```

### Geocoding

- Geocode on save (async job) when address fields change
- Store results in `latitude` / `longitude`
- Never expose coordinates in partner or public APIs

---

## 9. Matching Data Strategy

### Score Components

Stored on `matches` (and `match_candidates` in Phase 2):

| Field | Description | MVP |
|-------|-------------|-----|
| `distance_score` | Proximity donor ↔ recipient | Manual estimate |
| `urgency_score` | Move-in date, emergency flag | Manual |
| `category_match_score` | Item category = need category | Required binary |
| `priority_score` | Partner tier + request priority | Manual |
| `delivery_fit_score` | Recipient needs delivery + volunteer availability | Manual |
| `household_size_factor` | Beds/seating for household | In explanation JSON |
| `availability_window_overlap` | Donor availability vs schedule | Phase 2 |
| `match_score` | Weighted total 0–100 | Optional in MVP |

### Suggested Weights (Phase 2 Starting Point)

| Factor | Weight |
|--------|--------|
| Category match | Required (filter, not weight) |
| Distance | 35% |
| Urgency | 25% |
| Delivery fit | 20% |
| Partner priority | 10% |
| Condition fit | 10% |

### Human Approval

Every match requires `approved_by_user_id` and `approved_at` in MVP and Phase 2.

`is_override = true` requires `override_reason` when administrator selects non-top candidate.

`score_explanation` JSONB example:

```json
{
  "distance_miles": 4.2,
  "same_zip": false,
  "urgency": "emergency",
  "partner_tier": 1,
  "needs_delivery": true,
  "volunteer_available": false,
  "notes": "Closest available bed; recipient can pickup Saturday"
}
```

### Matching Triggers

| Event | Action |
|-------|--------|
| Item → `available` | Find queued requests with matching category in geo range |
| Request → `queued` | Find available items with matching category in geo range |
| Match → `match_rejected` / `match_expired` | Release item and need line; re-trigger |

---

## 10. Audit and Safety

### Change History

| Mechanism | Use |
|-----------|-----|
| `audit_log` | Status changes, approvals, overrides, address access |
| `updated_at` | Row-level last modified |
| `old_values` / `new_values` JSONB | Field-level diff on critical tables |
| Soft deletes | `deleted_at` on users and items; never hard delete PII |

### Required Audit Events

- `furniture_item.status_changed`
- `recipient_request.status_changed`
- `match.approved`, `match.rejected`, `match.overridden`
- `transfer.scheduled`, `transfer.completed`, `transfer.failed`
- `storage.exception_approved`
- `user.role_granted`, `user.role_revoked`
- `address.viewed` (sensitive field access)
- `exception.created`, `exception.resolved`

### Who Contacted Whom

- All outbound/inbound messages in `communications`
- `sent_by_user_id` for coordinator actions
- Template code links comms to workflow step

### Incident Reporting

- `exceptions` table with severity SLA:
  - `critical`: 1 hour
  - `high`: 4 hours
  - `medium`: 24 hours
  - `low`: 48 hours

### Fraud Prevention Signals (Flags → `exceptions`)

- Duplicate recipient identity (same name + phone + partner)
- Multiple open requests same household
- Donor item photos match stock images (Phase 7+)
- Partner referral quality score below threshold
- Repeated match rejections same recipient

### Data Privacy

- Encrypt sensitive columns at application layer or PG crypto for `address_line1`, `phone`
- Role-based access control scoped by entity
- Recipient PII minimized on `partner_referrals` until profile created
- Impact stories require `story_consent = true`
- Annual data retention review; anonymize completed records per policy

---

## 11. Naming Conventions

| Convention | Rule | Example |
|------------|------|---------|
| Table names | `snake_case`, **plural** | `furniture_items`, `recipient_requests` |
| Column names | `snake_case` | `move_in_date`, `zip_code` |
| Primary keys | `id` UUID | `id UUID PRIMARY KEY` |
| Foreign keys | `{singular_table}_id` | `donor_profile_id`, `match_id` |
| Timestamps | `timestamptz` | `created_at`, `updated_at`, `deleted_at` |
| Status columns | `status TEXT` with check constraint or enum | `status IN ('submitted', ...)` |
| Boolean flags | `is_` or `has_` prefix | `is_override`, `has_truck` |
| Counts | `_count` suffix | `reschedule_count`, `no_show_count` |
| Money | `_cents` integer suffix | `fair_market_value_cents` |
| Dimensions | `_in` or `_lbs` suffix | `width_in`, `weight_lbs` |
| Indexes | `idx_{table}_{columns}` | `idx_furniture_items_status_zip` |
| Enums in docs | snake_case lowercase | `under_review`, not `UNDER_REVIEW` |

---

## 12. Example SQL Schema (MVP)

PostgreSQL-style schema for Phase 1 launch. Intentionally small.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reference roles
CREATE TABLE roles (
    id          SMALLINT PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL
);

INSERT INTO roles (id, code, name) VALUES
    (1, 'donor', 'Donor'),
    (2, 'recipient', 'Recipient'),
    (3, 'volunteer', 'Volunteer'),
    (4, 'partner_user', 'Partner User'),
    (5, 'admin', 'Administrator');

-- Users
CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   TEXT,
    phone                   TEXT,
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    preferred_name          TEXT,
    status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive', 'suspended')),
    communication_preference TEXT
                            CHECK (communication_preference IN ('email', 'sms', 'phone', 'partner_mediated')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE user_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users (id),
    role_id             SMALLINT NOT NULL REFERENCES roles (id),
    granted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by_user_id  UUID REFERENCES users (id),
    revoked_at          TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_user_roles_active
    ON user_roles (user_id, role_id)
    WHERE revoked_at IS NULL;

-- Profiles
CREATE TABLE donor_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users (id),
    donor_type              TEXT,
    anonymous_impact_ok     BOOLEAN NOT NULL DEFAULT true,
    pickup_privacy_level    TEXT NOT NULL DEFAULT 'zip_only'
                            CHECK (pickup_privacy_level IN ('exact', 'cross_street', 'zip_only')),
    notes                   TEXT,
    repeat_donor            BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipient_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users (id),
    household_size          SMALLINT,
    has_vehicle             BOOLEAN,
    can_pickup_large_items  BOOLEAN,
    needs_delivery          BOOLEAN NOT NULL DEFAULT true,
    access_notes            TEXT,
    housing_verified        BOOLEAN NOT NULL DEFAULT false,
    housing_verified_at     TIMESTAMPTZ,
    housing_verified_by_user_id UUID REFERENCES users (id),
    primary_partner_org_id  UUID,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partners
CREATE TABLE partner_organizations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT NOT NULL,
    org_type                TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'applicant'
                            CHECK (status IN (
                                'applicant', 'under_review', 'active', 'probation',
                                'suspended', 'inactive', 'terminated'
                            )),
    referral_code           TEXT NOT NULL UNIQUE,
    priority_tier           SMALLINT NOT NULL DEFAULT 3 CHECK (priority_tier BETWEEN 1 AND 5),
    service_area_zip_codes  TEXT[],
    primary_contact_name    TEXT,
    primary_contact_email   TEXT,
    primary_contact_phone   TEXT,
    city                    TEXT,
    state                   TEXT,
    zip_code                TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recipient_profiles
    ADD CONSTRAINT fk_recipient_primary_partner
    FOREIGN KEY (primary_partner_org_id) REFERENCES partner_organizations (id);

CREATE TABLE partner_referrals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_organization_id UUID NOT NULL REFERENCES partner_organizations (id),
    submitted_by_user_id    UUID REFERENCES users (id),
    recipient_profile_id    UUID REFERENCES recipient_profiles (id),
    recipient_request_id    UUID,
    status                  TEXT NOT NULL DEFAULT 'submitted',
    client_first_name       TEXT NOT NULL,
    client_last_name        TEXT NOT NULL,
    client_phone            TEXT,
    move_in_date            DATE,
    urgency                 TEXT NOT NULL DEFAULT 'standard'
                            CHECK (urgency IN ('emergency', 'urgent', 'standard')),
    housing_confirmed       BOOLEAN NOT NULL DEFAULT false,
    notes                   TEXT,
    reviewed_by_user_id     UUID REFERENCES users (id),
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Furniture items (donor-held, not warehouse inventory)
CREATE TABLE furniture_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_profile_id        UUID NOT NULL REFERENCES donor_profiles (id),
    status                  TEXT NOT NULL DEFAULT 'submitted',
    category                TEXT NOT NULL,
    title                   TEXT,
    description             TEXT,
    condition               TEXT NOT NULL
                            CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    quantity                SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    width_in                SMALLINT,
    depth_in                SMALLINT,
    height_in               SMALLINT,
    requires_two_person     BOOLEAN NOT NULL DEFAULT false,
    pickup_constraints      TEXT,
    availability_start      DATE,
    availability_end        DATE,
    rejection_reason        TEXT,
    reviewed_by_user_id     UUID REFERENCES users (id),
    reviewed_at             TIMESTAMPTZ,
    address_line1           TEXT,
    city                    TEXT NOT NULL,
    state                   TEXT NOT NULL,
    zip_code                TEXT NOT NULL,
    cross_street            TEXT,
    latitude                NUMERIC(9, 6),
    longitude               NUMERIC(9, 6),
    display_location        TEXT,
    location_privacy_level  TEXT NOT NULL DEFAULT 'zip_only'
                            CHECK (location_privacy_level IN ('exact', 'cross_street', 'zip_only')),
    duplicate_of_item_id    UUID REFERENCES furniture_items (id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_furniture_items_matching
    ON furniture_items (status, category, zip_code)
    WHERE deleted_at IS NULL;

CREATE TABLE item_photos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    furniture_item_id   UUID NOT NULL REFERENCES furniture_items (id) ON DELETE CASCADE,
    url                 TEXT NOT NULL,
    sort_order          SMALLINT NOT NULL DEFAULT 1,
    is_primary          BOOLEAN NOT NULL DEFAULT false,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipient requests
CREATE TABLE recipient_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_profile_id    UUID NOT NULL REFERENCES recipient_profiles (id),
    partner_organization_id UUID REFERENCES partner_organizations (id),
    partner_referral_id     UUID REFERENCES partner_referrals (id),
    status                  TEXT NOT NULL DEFAULT 'submitted',
    priority                TEXT NOT NULL DEFAULT 'standard'
                            CHECK (priority IN ('emergency', 'urgent', 'standard')),
    move_in_date            DATE,
    housing_address_line1   TEXT,
    city                    TEXT NOT NULL,
    state                   TEXT NOT NULL,
    zip_code                TEXT NOT NULL,
    latitude                NUMERIC(9, 6),
    longitude               NUMERIC(9, 6),
    access_notes            TEXT,
    needs_delivery          BOOLEAN NOT NULL DEFAULT true,
    submitted_by_user_id    UUID REFERENCES users (id),
    reviewed_by_user_id     UUID REFERENCES users (id),
    reviewed_at             TIMESTAMPTZ,
    approved_at             TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    closed_reason           TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipient_requests_queue
    ON recipient_requests (status, priority, zip_code);

CREATE TABLE request_need_lines (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_request_id    UUID NOT NULL REFERENCES recipient_requests (id) ON DELETE CASCADE,
    category                TEXT NOT NULL,
    essential               BOOLEAN NOT NULL DEFAULT true,
    quantity_needed         SMALLINT NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
    quantity_matched        SMALLINT NOT NULL DEFAULT 0,
    status                  TEXT NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'matched', 'fulfilled', 'cancelled')),
    size_preference         TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE partner_referrals
    ADD CONSTRAINT fk_partner_referrals_request
    FOREIGN KEY (recipient_request_id) REFERENCES recipient_requests (id);

-- Matches
CREATE TABLE matches (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    furniture_item_id       UUID NOT NULL REFERENCES furniture_items (id),
    request_need_line_id    UUID NOT NULL REFERENCES request_need_lines (id),
    recipient_request_id    UUID NOT NULL REFERENCES recipient_requests (id),
    status                  TEXT NOT NULL DEFAULT 'pending_review',
    transfer_method         TEXT
                            CHECK (transfer_method IN ('pickup', 'volunteer_delivery', 'storage_then_transfer')),
    match_score             NUMERIC(5, 2),
    score_explanation       JSONB,
    is_override             BOOLEAN NOT NULL DEFAULT false,
    override_reason         TEXT,
    approved_by_user_id     UUID REFERENCES users (id),
    approved_at             TIMESTAMPTZ,
    rejected_by_party       TEXT,
    rejection_reason        TEXT,
    expires_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_override_reason
        CHECK (NOT is_override OR override_reason IS NOT NULL)
);

-- One active match per item
CREATE UNIQUE INDEX uq_matches_active_item
    ON matches (furniture_item_id)
    WHERE status NOT IN ('completed', 'cancelled', 'match_rejected', 'match_expired');

CREATE INDEX idx_matches_status ON matches (status);

-- Transfers
CREATE TABLE transfers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id                UUID NOT NULL REFERENCES matches (id),
    transfer_type           TEXT NOT NULL
                            CHECK (transfer_type IN ('pickup', 'volunteer_delivery')),
    status                  TEXT NOT NULL DEFAULT 'pending',
    scheduled_at            TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    pickup_address          TEXT,
    delivery_address        TEXT,
    meet_point_address      TEXT,
    reschedule_count        SMALLINT NOT NULL DEFAULT 0,
    failure_reason          TEXT,
    dispute_notes           TEXT,
    confirmed_by_user_id    UUID REFERENCES users (id),
    confirmed_by_role       TEXT,
    scheduled_by_user_id    UUID REFERENCES users (id),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transfers_scheduled ON transfers (status, scheduled_at);

-- Communications
CREATE TABLE communications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users (id),
    sent_by_user_id         UUID REFERENCES users (id),
    channel                 TEXT NOT NULL
                            CHECK (channel IN ('email', 'sms', 'phone', 'in_app')),
    direction               TEXT NOT NULL
                            CHECK (direction IN ('outbound', 'inbound')),
    template_code           TEXT,
    subject                 TEXT,
    body_preview            TEXT,
    related_entity_type     TEXT,
    related_entity_id       UUID,
    status                  TEXT NOT NULL DEFAULT 'queued'
                            CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    provider_message_id     TEXT,
    sent_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_communications_user ON communications (user_id, created_at DESC);

-- Audit log (append-only)
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id   UUID REFERENCES users (id),
    action          TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_user_id, created_at DESC);

-- Updated_at trigger helper (apply to mutable tables in application or via trigger)
```

---

## 13. Open Questions

These decisions require founder and operations review before implementation:

### Access & Intake

1. **Should recipients be allowed to self-register?** Constitution mandates low-tech and partner paths; self-registration may increase volume without verification. Recommendation: partner-primary intake for MVP; optional direct intake with `pending_verification`.

2. **Should exact donor addresses be stored at submission?** Required for transfer scheduling but increases privacy risk. Recommendation: store encrypted or restrict column access; collect exact address at `available` approval if not provided initially.

3. **Should partners have approval authority?** e.g. auto-approve requests from `active` partners. Recommendation: MVP requires administrator approval; partner pre-verification flag only.

### Item Policy

4. **Should mattresses be accepted?** Sanitation and liability concerns vs. high need. Decision affects `category` taxonomy and acceptance rules.

5. **Should appliances be in MVP taxonomy?** Roadmap includes appliances later; early inclusion affects intake forms and matching.

6. **Minimum photo requirements by category?** e.g. beds and couches require 3 photos and dimensions.

### Logistics & Volunteers

7. **Should delivery fees be tracked?** Paid mover exceptions vs. volunteer-only model. If yes, add `transfers.cost_cents` and `paid_logistics_exception` flag.

8. **Should volunteers be background checked before assignments?** Affects `volunteer_profiles.status` gating and onboarding timeline.

9. **Maximum geographic radius for pilot?** Defines matching filter and `distance_score` cap (e.g. 25 miles).

### Data & Compliance

10. **PII retention period for closed requests?** Anonymization schedule for recipients who exit the program.

11. **Tax receipt fair market value policy?** Donor-provided only vs. coordinator estimate vs. never include value.

12. **Multi-city data isolation?** Single database with `service_area_id` vs. separate schemas per metro at scale.

### Matching

13. **Auto-approve matches above score threshold?** Roadmap keeps human in loop through Phase 2; define threshold for Phase 7 automation if ever pursued.

14. **Allow one item to fulfill multiple need lines?** e.g. dining set → table + chairs. May require `match` grouping or bundle entity.

15. **Runner-up match notification?** When primary match rejects, auto-offer to second-ranked candidate from `match_candidates`.

---

## Document Governance

- Review when [Workflows](workflows.md) status definitions change
- Review before each roadmap phase schema migration
- SQL migrations versioned in repository alongside this document
- Amendment requires alignment check against Constitution Article IV (direct transfer) and Article X (guardrails)

---

*This data model coordinates community generosity—it does not inventory a warehouse.*
