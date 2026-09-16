-- Migration: Auto-Pause Settings & Schema Updates

-- 1. Add settings to system_settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS timer_auto_pause_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timer_max_hours INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS timer_action TEXT DEFAULT 'PAUSE_AND_NOTIFY'; -- 'PAUSE_AND_NOTIFY', 'NOTIFY_ADMIN'

-- 2. Add flag to time_logs to identify auto-paused logs
ALTER TABLE public.time_logs
ADD COLUMN IF NOT EXISTS auto_paused BOOLEAN DEFAULT false;

-- 3. Add 'PAUSED' to task status enum/check constraint
-- First, drop the existing constraint if it exists (assuming clear name)
-- Note: In Supabase/Postgres, often it's a Check constraint on the column.
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'DONE', 'PAUSED'));
