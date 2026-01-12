-- Migration: Add Weekly Workload Hours
-- Note: 'work_days' text[] already exists in the table.

ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS weekly_workload_hours NUMERIC DEFAULT 44.0;
