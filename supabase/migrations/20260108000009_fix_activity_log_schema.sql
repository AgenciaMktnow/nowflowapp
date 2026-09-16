-- =========================================================================================
-- FIX: ACTIVITY LOG SCHEMA REPAIR
-- Issue: The table 'task_activities' existed but was missing columns (likely 'action_type').
-- Solution: Explicitly add the missing columns.
-- =========================================================================================

DO $$
BEGIN
    -- 1. Ensure 'action_type' exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'task_activities' 
        AND column_name = 'action_type'
    ) THEN
        ALTER TABLE public.task_activities ADD COLUMN action_type TEXT;
    END IF;

    -- 2. Ensure 'details' exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'task_activities' 
        AND column_name = 'details'
    ) THEN
        ALTER TABLE public.task_activities ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- 3. Ensure 'user_id' exists (just in case)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'task_activities' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.task_activities ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

END $$;
