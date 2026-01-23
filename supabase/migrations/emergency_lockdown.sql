-- =========================================================================================
-- EMERGENCY LOCKDOWN: STOP ALL ACCESS
-- =========================================================================================
-- This script revokes all permissions from the API roles (authenticated, anon).
-- No user will be able to query, insert, or update anything via the Application/API.
-- Dashboard/SuperAdmin (postgres role) remains active.
-- =========================================================================================

BEGIN;

-- 1. Revoke Schema Usage
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- 2. Revoke Table Permissions
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- 3. Revoke Sequence Permissions (ID generation)
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 4. Revoke Function Execution
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Safety Verification output
DO $$
BEGIN
    RAISE NOTICE 'SYSTEM LOCKED: All access for authenticated/anon users has been revoked.';
END $$;

COMMIT;
