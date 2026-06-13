-- Sample active partner organization for dev referral form testing.
-- Run after migrations. Use referral code on /refer (Partner referral mode).

INSERT INTO partner_organizations (
  name,
  org_type,
  status,
  referral_code,
  priority_tier,
  primary_contact_name,
  primary_contact_email,
  city,
  state,
  zip_code
) VALUES (
  'Hope Recovery Center',
  'rehab_center',
  'active',
  'HOPE-2026',
  2,
  'Program Director',
  'director@hope-recovery.example',
  'Los Angeles',
  'CA',
  '90012'
);
