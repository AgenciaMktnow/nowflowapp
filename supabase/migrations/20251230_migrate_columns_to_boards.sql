-- Create board_columns table
CREATE TABLE IF NOT EXISTS board_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    variant TEXT NOT NULL DEFAULT 'default', -- 'default', 'progress', 'review', 'done'
    count_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_board_columns_board_id ON board_columns(board_id);

-- Migration Logic:
-- We want to migrate existing Project Columns to Board Columns.
-- BUT projects belong to boards.
-- If multiple projects in a board have different columns, which one wins?
-- Strategy:
-- 1. Find all Boards.
-- 2. For each Board, find ONE project (e.g. earliest created) that has custom columns.
-- 3. Copy those columns to `board_columns`.
-- 4. If no custom columns, seed defaults.

DO $$
DECLARE
    b_rec RECORD;
    p_rec RECORD;
    c_rec RECORD;
BEGIN
    FOR b_rec IN SELECT * FROM boards LOOP
        -- Check if board already has columns
        IF NOT EXISTS (SELECT 1 FROM board_columns WHERE board_id = b_rec.id) THEN
            -- Find a project with columns
            SELECT p.id INTO p_rec FROM projects p 
            JOIN project_columns pc ON pc.project_id = p.id 
            WHERE p.board_id = b_rec.id 
            LIMIT 1;
            
            IF p_rec IS NOT NULL THEN
                -- Copy columns from this project to the board
                INSERT INTO board_columns (board_id, title, position, variant, count_color)
                SELECT b_rec.id, title, position, variant, count_color
                FROM project_columns
                WHERE project_id = p_rec.id;
            ELSE
                 -- Seed Defaults if no project columns found
                 INSERT INTO board_columns (board_id, title, position, variant, count_color)
                 VALUES 
                 (b_rec.id, 'A Fazer', 0, 'default', 'bg-background-dark text-text-muted-dark'),
                 (b_rec.id, 'Em Andamento', 1, 'progress', 'bg-primary/20 text-green-300'),
                 (b_rec.id, 'Em Revisão', 2, 'review', 'bg-background-dark text-text-muted-dark'),
                 (b_rec.id, 'Concluído', 3, 'done', 'bg-primary/10 text-primary');
            END IF;
        END IF;
    END LOOP;
END $$;

-- RLS Policies
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON board_columns
    FOR SELECT
    TO authenticated
    USING (true); 

CREATE POLICY "Enable insert access for authenticated users" ON board_columns
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON board_columns
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON board_columns
    FOR DELETE
    TO authenticated
    USING (true);
