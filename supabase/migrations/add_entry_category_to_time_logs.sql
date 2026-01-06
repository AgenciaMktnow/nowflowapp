ALTER TABLE public.time_logs 
ADD COLUMN IF NOT EXISTS entry_category text DEFAULT 'TIMER';

COMMENT ON COLUMN public.time_logs.entry_category IS 'Category of the time log entry: TIMER, MANUAL_ENTRY, MANUAL_ADJUSTMENT';
