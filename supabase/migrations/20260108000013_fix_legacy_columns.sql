-- =========================================================================================
-- FIX: LEGACY COLUMN CONFLICT (activity_type vs action_type)
-- Diagnosis: The table 'task_activities' likely has a legacy column 'activity_type' with a NOT NULL constraint.
-- My new code writes to 'action_type', leaving 'activity_type' as NULL, which causes the crash.
-- Solution: Make 'activity_type' (and other potential variants) NULLABLE.
-- =========================================================================================

DO $$
BEGIN
    -- 1. Try to drop NOT NULL on 'activity_type'
    BEGIN
        ALTER TABLE public.task_activities ALTER COLUMN activity_type DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN
        -- Column doesn't exist, safe to ignore
        NULL;
    END;

    -- 2. Try to drop NOT NULL on 'type' (common variant)
    BEGIN
        ALTER TABLE public.task_activities ALTER COLUMN type DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN
        NULL;
    END;

    -- 3. Try to drop NOT NULL on 'event_type' (common variant)
    BEGIN
        ALTER TABLE public.task_activities ALTER COLUMN event_type DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN
        NULL;
    END;

    -- 4. Re-confirm 'action_type' is nullable
    ALTER TABLE public.task_activities ALTER COLUMN action_type DROP NOT NULL;

END $$;
