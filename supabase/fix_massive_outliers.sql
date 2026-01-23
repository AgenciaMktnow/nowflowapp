-- FIX MASSIVE OUTLIERS
-- Detects logs with duration > 24 hours (86400 seconds) and resets them to 0.
-- This triggers the 'update_task_total_duration' automatically to fix the Dashboard.

-- 1. Update the logs
UPDATE public.time_logs
SET 
    duration_seconds = 0,
    description = COALESCE(description, '') || ' [AUTO-FIX: Duração absurda (>24h) zerada automaticamente]'
WHERE 
    duration_seconds > 86400; -- 24 hours

-- 2. Force recalculation for all tasks just to be safe (idempotent)
UPDATE public.tasks
SET total_duration = (
    SELECT COALESCE(SUM(duration_seconds), 0)
    FROM public.time_logs
    WHERE task_id = tasks.id
);
