
-- Create project_columns table
CREATE TABLE IF NOT EXISTS project_columns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  count_color TEXT DEFAULT 'text-text-muted', -- storing color class for consistent UI
  variant TEXT CHECK (variant IN ('default', 'progress', 'review', 'done')) DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add column_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS column_id UUID REFERENCES project_columns(id) ON DELETE SET NULL;

-- Policy for project_columns (Open for now, can refine later)
ALTER TABLE project_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON project_columns FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert project_columns" ON project_columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update project_columns" ON project_columns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete project_columns" ON project_columns FOR DELETE USING (auth.role() = 'authenticated');
