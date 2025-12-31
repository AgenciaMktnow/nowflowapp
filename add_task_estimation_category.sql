-- Add estimated_time and category to tasks table for Advanced Reporting

-- 1. Add estimated_time (Numeric, representing hours, e.g. 1.5 = 1h 30m)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS estimated_time NUMERIC(10, 2) DEFAULT 0;

-- 2. Add category (Text, for simple tagging like 'Design', 'Meeting')
-- We use TEXT for flexibility as requested, but could be a Reference Table later.
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Optional: Add index for category if we plan to filter heavily by it
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- 4. Comment on columns for clarity
COMMENT ON COLUMN tasks.estimated_time IS 'Estimated effort in hours';
COMMENT ON COLUMN tasks.category IS 'Work category (e.g. Design, Development, Meeting)';
