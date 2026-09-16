-- Update tasks.column_id to reference board_columns instead of project_columns

-- 1. Drop old constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_column_id_fkey;

-- 2. Clear invalid column_ids (since we moved to new IDs in board_columns)
-- Ideally we would map them, but since we just created board_columns with new UUIDs, 
-- old IDs are pointing to nothing relevant in the new table context unless we kept IDs.
-- The previous migration generated NEW IDs.
-- So let's nullify old column_ids to force "Status-based" fallback initially.
UPDATE tasks SET column_id = NULL; 

-- 3. Add new constraint
ALTER TABLE tasks 
    ADD CONSTRAINT tasks_column_id_fkey 
    FOREIGN KEY (column_id) 
    REFERENCES board_columns(id) 
    ON DELETE SET NULL;

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
