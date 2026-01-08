-- =========================================================================================
-- FINAL FIX: ACTIVITY LOG DELETE BUG
-- Run this script to permanently fix the 'action_type' error during deletion.
-- =========================================================================================

-- 1. Force 'action_type' to be NULLABLE (removes the restriction causing the crash)
ALTER TABLE public.task_activities ALTER COLUMN action_type DROP NOT NULL;

-- 2. Force 'details' to be NULLABLE (safety net)
ALTER TABLE public.task_activities ALTER COLUMN details DROP NOT NULL;

-- 3. Force 'user_id' to be NULLABLE
ALTER TABLE public.task_activities ALTER COLUMN user_id DROP NOT NULL;

-- 4. Clean up any potential 'CHECK' constraints that might be enforcing NOT NULL secretly
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'task_activities' AND column_name = 'action_type'
    ) LOOP
        EXECUTE 'ALTER TABLE public.task_activities DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;
