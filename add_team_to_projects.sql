-- Add team_id column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Enable RLS (if not already) and policies if needed, though usually standard policies cover extended columns if table wide.
-- For good measure, ensure we can query it? usually inherits.

-- Optional: Create an index for performance
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
