-- Create Boards Table
CREATE TABLE IF NOT EXISTS boards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#10B981', -- Hex color for Kanban tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Board Members Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS board_members (
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

-- Update Projects Table to link with Boards
ALTER TABLE projects ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES boards(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read boards for now (simplifies initial setup)
CREATE POLICY "Allow public read access" ON boards FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert boards" ON boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update boards" ON boards FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete boards" ON boards FOR DELETE USING (auth.role() = 'authenticated');

-- Board Members RLS
CREATE POLICY "Allow public read access" ON board_members FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage board members" ON board_members FOR ALL USING (auth.role() = 'authenticated');
