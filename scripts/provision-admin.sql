-- Provision a coordinator/admin application user (dev Supabase SQL editor).
-- Replace the email and name, then run AFTER migrations including 0008_users_auth_id.

INSERT INTO users (email, first_name, last_name, status)
VALUES ('coordinator@example.org', 'Sleepwell', 'Coordinator', 'active');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 5
FROM users u
WHERE u.email = 'coordinator@example.org'
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role_id = 5
      AND ur.revoked_at IS NULL
  );

-- First login: use the same email on /login. Magic link links auth_id on callback.
