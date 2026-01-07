-- Add position column for Kanban ordering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position FLOAT8;

-- Populate existing data to match current 'created_at DESC' order
-- Row number 1 (Newest) gets 1000, Row 2 gets 2000, etc.
WITH ranked_tasks AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.tasks
)
UPDATE public.tasks
SET position = rt.rn * 1000.0
FROM ranked_tasks rt
WHERE tasks.id = rt.id;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks (position);

-- Update RLS if necessary? (No, standard update policy usually covers all columns, but good to check if column specifics exist)
-- Assuming existing Update policy covers all columns.
