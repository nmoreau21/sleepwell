-- Dev fixtures for MVP loop testing (dresser in Los Angeles 90012).
-- Idempotent: skips if test users already exist.
-- Run AFTER migrations and optionally provision-partner.sql.
-- Does NOT skip admin review — item stays submitted, request stays submitted.

DO $$
DECLARE
  donor_user_id uuid;
  recipient_user_id uuid;
  donor_profile_id uuid;
  recipient_profile_id uuid;
  partner_org_id uuid;
  partner_referral_id uuid;
  request_id uuid;
  item_id uuid;
BEGIN
  SELECT id INTO donor_user_id
  FROM users
  WHERE lower(email) = 'dev-donor@sleepwell.dev'
    AND deleted_at IS NULL;

  IF donor_user_id IS NULL THEN
    INSERT INTO users (email, first_name, last_name, phone, status)
    VALUES (
      'dev-donor@sleepwell.dev',
      'Dev',
      'Donor',
      '213-555-0101',
      'active'
    )
    RETURNING id INTO donor_user_id;

    INSERT INTO user_roles (user_id, role_id)
    VALUES (donor_user_id, 1);

    INSERT INTO donor_profiles (user_id, pickup_privacy_level, anonymous_impact_ok)
    VALUES (donor_user_id, 'zip_only', true)
    RETURNING id INTO donor_profile_id;
  ELSE
    SELECT id INTO donor_profile_id
    FROM donor_profiles
    WHERE user_id = donor_user_id;
  END IF;

  SELECT id INTO recipient_user_id
  FROM users
  WHERE lower(email) = 'dev-recipient@sleepwell.dev'
    AND deleted_at IS NULL;

  IF recipient_user_id IS NULL THEN
    INSERT INTO users (email, first_name, last_name, phone, status)
    VALUES (
      'dev-recipient@sleepwell.dev',
      'Dev',
      'Recipient',
      '213-555-0102',
      'active'
    )
    RETURNING id INTO recipient_user_id;

    INSERT INTO user_roles (user_id, role_id)
    VALUES (recipient_user_id, 2);

    INSERT INTO recipient_profiles (user_id, needs_delivery, housing_verified)
    VALUES (recipient_user_id, false, false)
    RETURNING id INTO recipient_profile_id;
  ELSE
    SELECT id INTO recipient_profile_id
    FROM recipient_profiles
    WHERE user_id = recipient_user_id;
  END IF;

  SELECT id INTO partner_org_id
  FROM partner_organizations
  WHERE referral_code = 'HOPE-2026'
  LIMIT 1;

  SELECT id INTO item_id
  FROM furniture_items
  WHERE donor_profile_id = donor_profile_id
    AND category = 'dresser'
    AND deleted_at IS NULL
  LIMIT 1;

  IF item_id IS NULL THEN
    INSERT INTO furniture_items (
      donor_profile_id,
      status,
      category,
      title,
      description,
      condition,
      quantity,
      city,
      state,
      zip_code,
      location_privacy_level,
      pickup_constraints
    ) VALUES (
      donor_profile_id,
      'submitted',
      'dresser',
      'Dev test dresser',
      'Seed fixture for MVP loop testing.',
      'good',
      1,
      'Los Angeles',
      'CA',
      '90012',
      'zip_only',
      'Seed data — photos pending.'
    )
    RETURNING id INTO item_id;
  END IF;

  SELECT id INTO request_id
  FROM recipient_requests
  WHERE recipient_profile_id = recipient_profile_id
    AND zip_code = '90012'
  ORDER BY created_at DESC
  LIMIT 1;

  IF request_id IS NULL THEN
    IF partner_org_id IS NOT NULL THEN
      INSERT INTO partner_referrals (
        partner_organization_id,
        recipient_profile_id,
        status,
        client_first_name,
        client_last_name,
        client_phone,
        urgency,
        housing_confirmed,
        notes
      ) VALUES (
        partner_org_id,
        recipient_profile_id,
        'submitted',
        'Dev',
        'Recipient',
        '213-555-0102',
        'urgent',
        true,
        'Seed partner referral for loop test.'
      )
      RETURNING id INTO partner_referral_id;
    END IF;

    INSERT INTO recipient_requests (
      recipient_profile_id,
      partner_organization_id,
      partner_referral_id,
      status,
      priority,
      city,
      state,
      zip_code,
      needs_delivery,
      submitted_by_user_id,
      expires_at,
      notes
    ) VALUES (
      recipient_profile_id,
      partner_org_id,
      partner_referral_id,
      'submitted',
      'urgent',
      'Los Angeles',
      'CA',
      '90012',
      false,
      recipient_user_id,
      now() + interval '60 days',
      'Seed request for MVP loop test.'
    )
    RETURNING id INTO request_id;

    INSERT INTO request_need_lines (
      recipient_request_id,
      category,
      essential,
      quantity_needed,
      status,
      notes
    ) VALUES (
      request_id,
      'dresser',
      true,
      1,
      'open',
      'Seed need line — dresser.'
    );

    IF partner_referral_id IS NOT NULL THEN
      UPDATE partner_referrals
      SET recipient_request_id = request_id,
          updated_at = now()
      WHERE id = partner_referral_id;
    END IF;
  END IF;
END $$;
