-- =========================================================================================
-- FINAL RESTORE: CLEANUP & UNLOCK
-- =========================================================================================

BEGIN;

-- 1. ENSURE RENAN IS DELETED (Safety Check)
DELETE FROM public.users WHERE email ILIKE '%renanpianucci%';


-- 2. RESTORE PERMISSIONS (UNLOCK SYSTEM)
-- Grant usage back to authenticated users so the app works again.

-- Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Table Permissions (CRUD)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Sequence Permissions (ID generation)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Function Execution
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 3. CONFIRMATION
DO $$
BEGIN
    RAISE NOTICE 'SYSTEM UNLOCKED. Renan (if present) has been deleted. Users can log in again.';
END $$;

COMMIT;
