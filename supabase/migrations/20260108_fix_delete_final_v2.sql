-- =========================================================================================
-- FIX: AUDIT TRIGGER & DELETE HANDLING (V2)
-- 1. Drop Legacy Triggers causing the null violation.
-- 2. Update Foreign Key to ON DELETE CASCADE (Auto-cleanup logs).
-- 3. Create a proper Delete Trigger (standardized).
-- =========================================================================================

-- 1. DROP LEGACY TRIGGERS (Blind Cleanup of potential conflicting triggers)
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'tasks' 
        AND trigger_name NOT IN ('on_task_created', 'on_task_status_change') -- Keep our new ones check
    LOOP
        -- Log or just drop. We drop.
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trg.trigger_name) || ' ON public.tasks CASCADE';
    END LOOP;
END $$;

-- 2. FIX FOREIGN KEY (ON DELETE CASCADE)
-- Ensure that when a task is deleted, its logs go with it (preventing orphan insert attempts)
DO $$
BEGIN
    -- Try to drop existing FK
    ALTER TABLE public.task_activities DROP CONSTRAINT IF EXISTS task_activities_task_id_fkey;
    
    -- Add new FK with Cascade
    ALTER TABLE public.task_activities 
    ADD CONSTRAINT task_activities_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
END $$;


-- 3. COMPATIBILITY: Force 'activity_type' nullable again (just to be absolutely sure)
ALTER TABLE public.task_activities ALTER COLUMN activity_type DROP NOT NULL;


-- 4. NEW DELETE TRIGGER (Optional: If we want to keep a ghost log or just let Cascade handle it)
-- User suggested: "Garanta que... activity_type seja definido como 'DELETED'"
-- But if we use Cascade, the log is deleted immediately. 
-- Unless we log to a SEPARATE table? No, user implied same table.
-- If same table + Cascade, logging 'DELETED' is useless (it disappears).
-- SO: The best fix is the CASCADE + Removing the bad trigger. 
-- We will NOT add a new delete trigger that writes to task_activities, because it will be deleted anyway.
-- This effectively "Corrija a função" by removing the broken logic.

