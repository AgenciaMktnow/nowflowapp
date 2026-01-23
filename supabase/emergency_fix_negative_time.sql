-- EMERGENCY FIX: ZERO OUT NEGATIVE TIME LOGS
-- Objective: Fix the -2650h error on Dashboard immediately.

-- 1. Identify the negative logs (Optional: run this first to see what will be changed)
-- SELECT id, task_id, duration_seconds, description FROM time_logs WHERE duration_seconds < 0;

-- 2. Update negative duration logs to 0 seconds.
-- This effectively "neutralizes" the negative adjustment without deleting the audit record itself.
UPDATE time_logs
SET 
    duration_seconds = 0,
    description = COALESCE(description, '') || ' [AUTO-FIX: Valor negativo zerado para correção de Dashboard]'
WHERE 
    duration_seconds < 0;

-- 3. Verify the fix
-- SELECT id, task_id, duration_seconds FROM time_logs WHERE duration_seconds < 0;
