-- Migration: Add Mentions Column to Comments
-- Fixes error: record "new" has no field "mentions"

-- 1. Add mentions column (Array of UUIDs)
ALTER TABLE public.task_comments 
ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';

-- 2. Add index for performance (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_task_comments_mentions ON public.task_comments USING GIN (mentions);

-- 3. Update RLS if needed (Standard Insert policy usually covers new columns)
-- Assuming existing policy "Allow authenticated users to insert comments" covers it.
