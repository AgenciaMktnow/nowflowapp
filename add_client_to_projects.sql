-- Add client_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create an index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
