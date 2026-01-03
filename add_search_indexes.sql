-- Add indexes for search performance
-- These indexes will significantly improve search query performance when filtering by names

-- Index on clients.name for fast client name searches
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Index on projects.name for fast project name searches
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Index on projects.client_id for faster joins
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- Index on tasks.project_id for faster joins
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Index on tasks.client_id for direct client associations
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- Composite index for task search (title + task_number)
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks(title, task_number);

-- Index on tasks.title using GIN for full-text search (optional, for future)
-- CREATE INDEX IF NOT EXISTS idx_tasks_title_gin ON tasks USING gin(to_tsvector('portuguese', title));
