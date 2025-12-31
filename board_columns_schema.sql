-- Create board_columns table to persist custom columns
CREATE TABLE IF NOT EXISTS board_columns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  statuses TEXT[] NOT NULL,
  variant TEXT DEFAULT 'default',
  count_color TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

-- Allow all access for authenticated users (simplified for MVP)
CREATE POLICY "Allow all access" ON board_columns FOR ALL USING (true);
