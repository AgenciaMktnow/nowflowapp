-- =========================================================================================
-- CLEANUP & SYNC: GHOSTBUSTERS + HISTORY PROTECTION
-- =========================================================================================

-- NOTE: Run this entire block in Supabase SQL Editor.

BEGIN;

-- 1. DELETE GHOST USERS
-- Delete public users that do not have a matching auth.users record.
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. PROTECT HISTORY (ON DELETE SET NULL)

-- A. TASKS (Assignee)
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) 
    REFERENCES public.users(id) 
    ON DELETE SET NULL;

-- B. TASKS (Creator)
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES public.users(id) 
    ON DELETE SET NULL;

-- D. TIME LOGS (User)
ALTER TABLE public.time_logs
DROP CONSTRAINT IF EXISTS time_logs_user_id_fkey;

ALTER TABLE public.time_logs
ADD CONSTRAINT time_logs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;


-- 3. SYNC AUTH -> PUBLIC (ON DELETE CASCADE)
-- Ensure public profile is deleted when auth user is deleted.
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id) 
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

COMMIT;
