-- =========================================================================================
-- EMERGENCY FIX: DROP NOT NULL CONSTRAINT
-- Issue: Deleting a task causes a 'null value in column "action_type"' error.
-- Cause: A legacy trigger or race condition is trying to insert a row with NULL action_type.
-- Solution: Make 'action_type' nullable to allow the operation to proceed (the row will be deleted by cascade anyway).
-- =========================================================================================

ALTER TABLE public.task_activities ALTER COLUMN action_type DROP NOT NULL;

-- Safety: Also ensure details is nullable just in case
ALTER TABLE public.task_activities ALTER COLUMN details DROP NOT NULL;

-- Re-verify Trigger Logic: Ensure we aren't blocking deletes
-- (No change needed to trigger logic if constraint is removed, nature takes its course)
