-- 0014: Row Level Security for all public application tables
--
-- Auth model (see lib/auth/link-user.ts, db/schema/users.ts):
--   Supabase Auth user id  -> users.auth_id
--   Application user id    -> users.id
--   Roles                  -> user_roles + roles (codes: donor, recipient, volunteer,
--                             partner_user, admin)
--
-- Partner scoping requires partner_users (documented in docs/database-design.md;
-- not present before this migration).
--
-- Server runtime (Drizzle via DATABASE_URL as postgres / service_role) bypasses RLS.
-- These policies apply to authenticated JWT clients (Supabase PostgREST / client SDK).
-- anon role has no policies — public forms continue via server actions only.
--
-- Role ids (roles table): 1=donor, 2=recipient, 3=volunteer, 4=partner_user, 5=admin
-- Volunteer role: no dedicated assignment tables in MVP — no volunteer-scoped policies yet.

-- ---------------------------------------------------------------------------
-- Prerequisite: partner_users (partner org membership)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "partner_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "partner_organization_id" uuid NOT NULL REFERENCES "partner_organizations" ("id"),
  "job_title" text,
  "is_primary_contact" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "uq_partner_users_user_org" UNIQUE ("user_id", "partner_organization_id")
);

CREATE INDEX IF NOT EXISTS "idx_partner_users_org"
  ON "partner_users" ("partner_organization_id");

-- ---------------------------------------------------------------------------
-- Helper schema and SECURITY DEFINER functions (read across RLS boundaries)
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM users u
  WHERE u.auth_id = auth.uid()
    AND u.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.has_role(role_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON r.id = ur.role_id
    INNER JOIN users u ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid()
      AND u.deleted_at IS NULL
      AND ur.revoked_at IS NULL
      AND r.code = role_code
  );
$$;

CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app.has_role('admin');
$$;

CREATE OR REPLACE FUNCTION app.is_donor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app.has_role('donor');
$$;

CREATE OR REPLACE FUNCTION app.is_recipient()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app.has_role('recipient');
$$;

CREATE OR REPLACE FUNCTION app.is_partner_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app.has_role('partner_user');
$$;

CREATE OR REPLACE FUNCTION app.current_donor_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dp.id
  FROM donor_profiles dp
  INNER JOIN users u ON u.id = dp.user_id
  WHERE u.auth_id = auth.uid()
    AND u.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.current_recipient_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rp.id
  FROM recipient_profiles rp
  INNER JOIN users u ON u.id = rp.user_id
  WHERE u.auth_id = auth.uid()
    AND u.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.user_partner_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pu.partner_organization_id
  FROM partner_users pu
  INNER JOIN users u ON u.id = pu.user_id
  WHERE u.auth_id = auth.uid()
    AND u.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION app.partner_can_access_organization(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id IN (SELECT app.user_partner_organization_ids());
$$;

GRANT USAGE ON SCHEMA app TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on all public application tables
-- ---------------------------------------------------------------------------

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipient_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_need_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_records ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- roles (reference data)
-- ---------------------------------------------------------------------------

CREATE POLICY roles_select_authenticated
  ON roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY roles_insert_admin
  ON roles FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY roles_update_admin
  ON roles FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY roles_delete_admin
  ON roles FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_admin
  ON users FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY users_select_self
  ON users FOR SELECT TO authenticated
  USING (auth_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY users_insert_admin
  ON users FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY users_update_admin
  ON users FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY users_update_self
  ON users FOR UPDATE TO authenticated
  USING (auth_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (
    auth_id = auth.uid()
    AND deleted_at IS NULL
    AND status = (SELECT u.status FROM users u WHERE u.id = users.id)
  );

CREATE POLICY users_delete_admin
  ON users FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

CREATE POLICY user_roles_select_admin
  ON user_roles FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY user_roles_select_self
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = app.current_app_user_id() AND revoked_at IS NULL);

CREATE POLICY user_roles_insert_admin
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY user_roles_update_admin
  ON user_roles FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY user_roles_delete_admin
  ON user_roles FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- donor_profiles
-- ---------------------------------------------------------------------------

CREATE POLICY donor_profiles_select_admin
  ON donor_profiles FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY donor_profiles_select_self
  ON donor_profiles FOR SELECT TO authenticated
  USING (user_id = app.current_app_user_id());

CREATE POLICY donor_profiles_insert_admin
  ON donor_profiles FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY donor_profiles_insert_self
  ON donor_profiles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = app.current_app_user_id()
    AND app.is_donor()
  );

CREATE POLICY donor_profiles_update_admin
  ON donor_profiles FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY donor_profiles_update_self
  ON donor_profiles FOR UPDATE TO authenticated
  USING (user_id = app.current_app_user_id())
  WITH CHECK (user_id = app.current_app_user_id());

CREATE POLICY donor_profiles_delete_admin
  ON donor_profiles FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- recipient_profiles
-- ---------------------------------------------------------------------------

CREATE POLICY recipient_profiles_select_admin
  ON recipient_profiles FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY recipient_profiles_select_self
  ON recipient_profiles FOR SELECT TO authenticated
  USING (user_id = app.current_app_user_id());

CREATE POLICY recipient_profiles_select_partner
  ON recipient_profiles FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND primary_partner_org_id IN (SELECT app.user_partner_organization_ids())
  );

CREATE POLICY recipient_profiles_insert_admin
  ON recipient_profiles FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY recipient_profiles_insert_self
  ON recipient_profiles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = app.current_app_user_id()
    AND app.is_recipient()
  );

CREATE POLICY recipient_profiles_update_admin
  ON recipient_profiles FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY recipient_profiles_update_self
  ON recipient_profiles FOR UPDATE TO authenticated
  USING (user_id = app.current_app_user_id())
  WITH CHECK (user_id = app.current_app_user_id());

CREATE POLICY recipient_profiles_delete_admin
  ON recipient_profiles FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- partner_organizations
-- ---------------------------------------------------------------------------

CREATE POLICY partner_organizations_select_admin
  ON partner_organizations FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY partner_organizations_select_partner
  ON partner_organizations FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND id IN (SELECT app.user_partner_organization_ids())
  );

CREATE POLICY partner_organizations_insert_admin
  ON partner_organizations FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY partner_organizations_update_admin
  ON partner_organizations FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY partner_organizations_delete_admin
  ON partner_organizations FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- partner_users
-- ---------------------------------------------------------------------------

CREATE POLICY partner_users_select_admin
  ON partner_users FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY partner_users_select_self
  ON partner_users FOR SELECT TO authenticated
  USING (user_id = app.current_app_user_id());

CREATE POLICY partner_users_select_partner_org
  ON partner_users FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND partner_organization_id IN (SELECT app.user_partner_organization_ids())
  );

CREATE POLICY partner_users_insert_admin
  ON partner_users FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY partner_users_update_admin
  ON partner_users FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY partner_users_delete_admin
  ON partner_users FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- partner_referrals
-- ---------------------------------------------------------------------------

CREATE POLICY partner_referrals_select_admin
  ON partner_referrals FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY partner_referrals_select_partner
  ON partner_referrals FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND partner_organization_id IN (SELECT app.user_partner_organization_ids())
  );

CREATE POLICY partner_referrals_select_recipient
  ON partner_referrals FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND recipient_profile_id = app.current_recipient_profile_id()
  );

CREATE POLICY partner_referrals_insert_admin
  ON partner_referrals FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY partner_referrals_insert_partner
  ON partner_referrals FOR INSERT TO authenticated
  WITH CHECK (
    app.is_partner_user()
    AND partner_organization_id IN (SELECT app.user_partner_organization_ids())
    AND (
      submitted_by_user_id IS NULL
      OR submitted_by_user_id = app.current_app_user_id()
    )
  );

CREATE POLICY partner_referrals_update_admin
  ON partner_referrals FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY partner_referrals_update_partner
  ON partner_referrals FOR UPDATE TO authenticated
  USING (
    app.is_partner_user()
    AND partner_organization_id IN (SELECT app.user_partner_organization_ids())
  )
  WITH CHECK (
    app.is_partner_user()
    AND partner_organization_id IN (SELECT app.user_partner_organization_ids())
  );

CREATE POLICY partner_referrals_delete_admin
  ON partner_referrals FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- furniture_items
-- ---------------------------------------------------------------------------

CREATE POLICY furniture_items_select_admin
  ON furniture_items FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY furniture_items_select_donor
  ON furniture_items FOR SELECT TO authenticated
  USING (
    app.is_donor()
    AND donor_profile_id = app.current_donor_profile_id()
    AND deleted_at IS NULL
  );

CREATE POLICY furniture_items_select_recipient_matched
  ON furniture_items FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM matches m
      INNER JOIN recipient_requests rr ON rr.id = m.recipient_request_id
      INNER JOIN recipient_profiles rp ON rp.id = rr.recipient_profile_id
      INNER JOIN users u ON u.id = rp.user_id
      WHERE m.furniture_item_id = furniture_items.id
        AND u.auth_id = auth.uid()
        AND u.deleted_at IS NULL
    )
  );

CREATE POLICY furniture_items_insert_admin
  ON furniture_items FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY furniture_items_insert_donor
  ON furniture_items FOR INSERT TO authenticated
  WITH CHECK (
    app.is_donor()
    AND donor_profile_id = app.current_donor_profile_id()
  );

CREATE POLICY furniture_items_update_admin
  ON furniture_items FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY furniture_items_update_donor
  ON furniture_items FOR UPDATE TO authenticated
  USING (
    app.is_donor()
    AND donor_profile_id = app.current_donor_profile_id()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    app.is_donor()
    AND donor_profile_id = app.current_donor_profile_id()
    AND deleted_at IS NULL
  );

CREATE POLICY furniture_items_delete_admin
  ON furniture_items FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- item_photos
-- ---------------------------------------------------------------------------

CREATE POLICY item_photos_select_admin
  ON item_photos FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY item_photos_select_donor
  ON item_photos FOR SELECT TO authenticated
  USING (
    app.is_donor()
    AND EXISTS (
      SELECT 1
      FROM furniture_items fi
      WHERE fi.id = item_photos.furniture_item_id
        AND fi.donor_profile_id = app.current_donor_profile_id()
        AND fi.deleted_at IS NULL
    )
  );

CREATE POLICY item_photos_select_recipient_matched
  ON item_photos FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND EXISTS (
      SELECT 1
      FROM furniture_items fi
      INNER JOIN matches m ON m.furniture_item_id = fi.id
      INNER JOIN recipient_requests rr ON rr.id = m.recipient_request_id
      INNER JOIN recipient_profiles rp ON rp.id = rr.recipient_profile_id
      INNER JOIN users u ON u.id = rp.user_id
      WHERE fi.id = item_photos.furniture_item_id
        AND u.auth_id = auth.uid()
        AND u.deleted_at IS NULL
        AND fi.deleted_at IS NULL
    )
  );

CREATE POLICY item_photos_insert_admin
  ON item_photos FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY item_photos_insert_donor
  ON item_photos FOR INSERT TO authenticated
  WITH CHECK (
    app.is_donor()
    AND EXISTS (
      SELECT 1
      FROM furniture_items fi
      WHERE fi.id = item_photos.furniture_item_id
        AND fi.donor_profile_id = app.current_donor_profile_id()
        AND fi.deleted_at IS NULL
    )
  );

CREATE POLICY item_photos_update_admin
  ON item_photos FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY item_photos_update_donor
  ON item_photos FOR UPDATE TO authenticated
  USING (
    app.is_donor()
    AND EXISTS (
      SELECT 1
      FROM furniture_items fi
      WHERE fi.id = item_photos.furniture_item_id
        AND fi.donor_profile_id = app.current_donor_profile_id()
        AND fi.deleted_at IS NULL
    )
  )
  WITH CHECK (
    app.is_donor()
    AND EXISTS (
      SELECT 1
      FROM furniture_items fi
      WHERE fi.id = item_photos.furniture_item_id
        AND fi.donor_profile_id = app.current_donor_profile_id()
        AND fi.deleted_at IS NULL
    )
  );

CREATE POLICY item_photos_delete_admin
  ON item_photos FOR DELETE TO authenticated
  USING (app.is_admin());

CREATE POLICY item_photos_delete_donor
  ON item_photos FOR DELETE TO authenticated
  USING (
    app.is_donor()
    AND EXISTS (
      SELECT 1
      FROM furniture_items fi
      WHERE fi.id = item_photos.furniture_item_id
        AND fi.donor_profile_id = app.current_donor_profile_id()
        AND fi.deleted_at IS NULL
    )
  );

-- ---------------------------------------------------------------------------
-- recipient_requests
-- ---------------------------------------------------------------------------

CREATE POLICY recipient_requests_select_admin
  ON recipient_requests FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY recipient_requests_select_recipient
  ON recipient_requests FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND recipient_profile_id = app.current_recipient_profile_id()
  );

CREATE POLICY recipient_requests_select_partner
  ON recipient_requests FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND partner_organization_id IN (SELECT app.user_partner_organization_ids())
  );

CREATE POLICY recipient_requests_insert_admin
  ON recipient_requests FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY recipient_requests_insert_recipient
  ON recipient_requests FOR INSERT TO authenticated
  WITH CHECK (
    app.is_recipient()
    AND recipient_profile_id = app.current_recipient_profile_id()
    AND (
      submitted_by_user_id IS NULL
      OR submitted_by_user_id = app.current_app_user_id()
    )
  );

CREATE POLICY recipient_requests_insert_partner
  ON recipient_requests FOR INSERT TO authenticated
  WITH CHECK (
    app.is_partner_user()
    AND partner_organization_id IN (SELECT app.user_partner_organization_ids())
    AND (
      submitted_by_user_id IS NULL
      OR submitted_by_user_id = app.current_app_user_id()
    )
  );

CREATE POLICY recipient_requests_update_admin
  ON recipient_requests FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY recipient_requests_update_recipient
  ON recipient_requests FOR UPDATE TO authenticated
  USING (
    app.is_recipient()
    AND recipient_profile_id = app.current_recipient_profile_id()
  )
  WITH CHECK (
    app.is_recipient()
    AND recipient_profile_id = app.current_recipient_profile_id()
  );

CREATE POLICY recipient_requests_delete_admin
  ON recipient_requests FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- request_need_lines
-- ---------------------------------------------------------------------------

CREATE POLICY request_need_lines_select_admin
  ON request_need_lines FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY request_need_lines_select_recipient
  ON request_need_lines FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = request_need_lines.recipient_request_id
        AND rr.recipient_profile_id = app.current_recipient_profile_id()
    )
  );

CREATE POLICY request_need_lines_select_partner
  ON request_need_lines FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = request_need_lines.recipient_request_id
        AND rr.partner_organization_id IN (SELECT app.user_partner_organization_ids())
    )
  );

CREATE POLICY request_need_lines_insert_admin
  ON request_need_lines FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY request_need_lines_insert_recipient
  ON request_need_lines FOR INSERT TO authenticated
  WITH CHECK (
    app.is_recipient()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = request_need_lines.recipient_request_id
        AND rr.recipient_profile_id = app.current_recipient_profile_id()
    )
  );

CREATE POLICY request_need_lines_insert_partner
  ON request_need_lines FOR INSERT TO authenticated
  WITH CHECK (
    app.is_partner_user()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = request_need_lines.recipient_request_id
        AND rr.partner_organization_id IN (SELECT app.user_partner_organization_ids())
    )
  );

CREATE POLICY request_need_lines_update_admin
  ON request_need_lines FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY request_need_lines_update_recipient
  ON request_need_lines FOR UPDATE TO authenticated
  USING (
    app.is_recipient()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = request_need_lines.recipient_request_id
        AND rr.recipient_profile_id = app.current_recipient_profile_id()
    )
  )
  WITH CHECK (
    app.is_recipient()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = request_need_lines.recipient_request_id
        AND rr.recipient_profile_id = app.current_recipient_profile_id()
    )
  );

CREATE POLICY request_need_lines_delete_admin
  ON request_need_lines FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------

CREATE POLICY matches_select_admin
  ON matches FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY matches_select_donor
  ON matches FOR SELECT TO authenticated
  USING (
    app.is_donor()
    AND EXISTS (
      SELECT 1
      FROM furniture_items fi
      WHERE fi.id = matches.furniture_item_id
        AND fi.donor_profile_id = app.current_donor_profile_id()
        AND fi.deleted_at IS NULL
    )
  );

CREATE POLICY matches_select_recipient
  ON matches FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = matches.recipient_request_id
        AND rr.recipient_profile_id = app.current_recipient_profile_id()
    )
  );

CREATE POLICY matches_select_partner
  ON matches FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND EXISTS (
      SELECT 1
      FROM recipient_requests rr
      WHERE rr.id = matches.recipient_request_id
        AND rr.partner_organization_id IN (SELECT app.user_partner_organization_ids())
    )
  );

CREATE POLICY matches_insert_admin
  ON matches FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY matches_update_admin
  ON matches FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY matches_delete_admin
  ON matches FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- transfers
-- ---------------------------------------------------------------------------

CREATE POLICY transfers_select_admin
  ON transfers FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY transfers_select_donor
  ON transfers FOR SELECT TO authenticated
  USING (
    app.is_donor()
    AND EXISTS (
      SELECT 1
      FROM matches m
      INNER JOIN furniture_items fi ON fi.id = m.furniture_item_id
      WHERE m.id = transfers.match_id
        AND fi.donor_profile_id = app.current_donor_profile_id()
        AND fi.deleted_at IS NULL
    )
  );

CREATE POLICY transfers_select_recipient
  ON transfers FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND EXISTS (
      SELECT 1
      FROM matches m
      INNER JOIN recipient_requests rr ON rr.id = m.recipient_request_id
      WHERE m.id = transfers.match_id
        AND rr.recipient_profile_id = app.current_recipient_profile_id()
    )
  );

CREATE POLICY transfers_select_partner
  ON transfers FOR SELECT TO authenticated
  USING (
    app.is_partner_user()
    AND EXISTS (
      SELECT 1
      FROM matches m
      INNER JOIN recipient_requests rr ON rr.id = m.recipient_request_id
      WHERE m.id = transfers.match_id
        AND rr.partner_organization_id IN (SELECT app.user_partner_organization_ids())
    )
  );

CREATE POLICY transfers_insert_admin
  ON transfers FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY transfers_update_admin
  ON transfers FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY transfers_delete_admin
  ON transfers FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- communications
-- ---------------------------------------------------------------------------

CREATE POLICY communications_select_admin
  ON communications FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY communications_select_self
  ON communications FOR SELECT TO authenticated
  USING (user_id = app.current_app_user_id());

CREATE POLICY communications_insert_admin
  ON communications FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY communications_update_admin
  ON communications FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY communications_delete_admin
  ON communications FOR DELETE TO authenticated
  USING (app.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log (admin read-only; writes via server)
-- ---------------------------------------------------------------------------

CREATE POLICY audit_log_select_admin
  ON audit_log FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY audit_log_insert_admin
  ON audit_log FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

-- ---------------------------------------------------------------------------
-- impact_records
-- ---------------------------------------------------------------------------

CREATE POLICY impact_records_select_admin
  ON impact_records FOR SELECT TO authenticated
  USING (app.is_admin());

CREATE POLICY impact_records_select_donor
  ON impact_records FOR SELECT TO authenticated
  USING (
    app.is_donor()
    AND donor_user_id = app.current_app_user_id()
  );

CREATE POLICY impact_records_select_recipient
  ON impact_records FOR SELECT TO authenticated
  USING (
    app.is_recipient()
    AND recipient_user_id = app.current_app_user_id()
  );

CREATE POLICY impact_records_insert_admin
  ON impact_records FOR INSERT TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY impact_records_update_admin
  ON impact_records FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY impact_records_delete_admin
  ON impact_records FOR DELETE TO authenticated
  USING (app.is_admin());
