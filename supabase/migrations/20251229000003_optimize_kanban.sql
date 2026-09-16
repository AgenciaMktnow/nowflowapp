-- Add index to project_columns for performance
CREATE INDEX IF NOT EXISTS idx_project_columns_project_id ON project_columns(project_id);

-- Ensure RLS allows reading (redundant but safe)
ALTER TABLE project_columns FORCE ROW LEVEL SECURITY;
