-- MIGRATION: TIME TRACKING NET BALANCE SYSTEM
-- 1. CLEANUP: Zero out all negative time logs (The "Emergency Fix")
UPDATE public.time_logs
SET duration_seconds = 0, description = COALESCE(description, '') || ' [AUTO-FIX: Negative value normalized]'
WHERE duration_seconds < 0;

-- 2. INFRASTRUCTURE: Add total_duration column to tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS total_duration INTEGER DEFAULT 0;

-- 3. CALCULATION: Populate total_duration for existing tasks
WITH calculated_times AS (
    SELECT task_id, COALESCE(SUM(duration_seconds), 0) as total
    FROM public.time_logs
    GROUP BY task_id
)
UPDATE public.tasks
SET total_duration = calculated_times.total
FROM calculated_times
WHERE tasks.id = calculated_times.task_id;

-- 4. SAFETY: Add Check Constraint to prevent negative balances
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_total_duration_non_negative CHECK (total_duration >= 0);

-- 5. AUTOMATION: Trigger to keep total_duration in sync
CREATE OR REPLACE FUNCTION public.update_task_total_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle standard Insert/Update/Delete
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.tasks
        SET total_duration = (
            SELECT COALESCE(SUM(duration_seconds), 0)
            FROM public.time_logs
            WHERE task_id = NEW.task_id
        )
        WHERE id = NEW.task_id;
    END IF;

    -- Handle Delete (or task_id change which is rare) using OLD
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.task_id IS DISTINCT FROM NEW.task_id)) THEN
        UPDATE public.tasks
        SET total_duration = (
            SELECT COALESCE(SUM(duration_seconds), 0)
            FROM public.time_logs
            WHERE task_id = OLD.task_id
        )
        WHERE id = OLD.task_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication errors on re-runs
DROP TRIGGER IF EXISTS trigger_update_task_total_duration ON public.time_logs;

CREATE TRIGGER trigger_update_task_total_duration
AFTER INSERT OR UPDATE OR DELETE ON public.time_logs
FOR EACH ROW EXECUTE FUNCTION public.update_task_total_duration();
