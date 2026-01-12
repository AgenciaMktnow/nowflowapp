-- Migration to fix missing Default Columns on Boards
-- This script iterates through all boards, checks if they have columns, and if not (or if they are incomplete), backfills the defaults.
-- It also attempts to 'rescue' orphaned tasks by resetting their column_id if they point to a non-existent column, allowing the frontend to catch them with status-based defaults (or the newly created real defaults).

DO $$
DECLARE
    b_rec RECORD;
    col_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Starting Board Column Recovery...';

    FOR b_rec IN SELECT * FROM boards LOOP
        -- Check if board has ANY columns
        SELECT EXISTS (SELECT 1 FROM board_columns WHERE board_id = b_rec.id) INTO col_exists;

        -- If NO columns exist, this is a "broken" board (likely created via the buggy createBoard version)
        -- OR it's a board that was relying purely on frontend defaults and now has custom data that hid them.
        -- ACTUALLY, if the user added ONE custom column, col_exists will be TRUE.
        -- But clearly the DEFAULT columns are missing.
        -- So we should strictly check for the presence of the standard variants.
        
        -- Strategy: Ensure the 4 base columns exist. If not, create them.
        
        -- 1. A Fazer (TO DO)
        IF NOT EXISTS (SELECT 1 FROM board_columns WHERE board_id = b_rec.id AND (title ILIKE 'A Fazer' OR variant = 'default')) THEN
           INSERT INTO board_columns (board_id, title, position, variant, count_color)
           VALUES (b_rec.id, 'A Fazer', 0, 'default', 'bg-background-dark text-text-muted-dark');
           RAISE NOTICE 'Restored "A Fazer" for board %', b_rec.name;
        END IF;

        -- 2. Em Andamento (IN PROGRESS)
        IF NOT EXISTS (SELECT 1 FROM board_columns WHERE board_id = b_rec.id AND (title ILIKE 'Em Andamento' OR variant = 'progress')) THEN
           INSERT INTO board_columns (board_id, title, position, variant, count_color)
           VALUES (b_rec.id, 'Em Andamento', 1, 'progress', 'bg-primary/20 text-green-300');
           RAISE NOTICE 'Restored "Em Andamento" for board %', b_rec.name;
        END IF;

        -- 3. Em Revisão (REVIEW)
        IF NOT EXISTS (SELECT 1 FROM board_columns WHERE board_id = b_rec.id AND (title ILIKE 'Em Revisão' OR variant = 'review')) THEN
           INSERT INTO board_columns (board_id, title, position, variant, count_color)
           VALUES (b_rec.id, 'Em Revisão', 2, 'review', 'bg-background-dark text-text-muted-dark');
           RAISE NOTICE 'Restored "Em Revisão" for board %', b_rec.name;
        END IF;

        -- 4. Concluído (DONE)
        IF NOT EXISTS (SELECT 1 FROM board_columns WHERE board_id = b_rec.id AND (title ILIKE 'Concluído' OR variant = 'done')) THEN
           INSERT INTO board_columns (board_id, title, position, variant, count_color)
           VALUES (b_rec.id, 'Concluído', 3, 'done', 'bg-primary/10 text-primary');
           RAISE NOTICE 'Restored "Concluído" for board %', b_rec.name;
        END IF;

    END LOOP;

    -- TASK RESCUE OPERATION
    -- Find tasks that reference a column_id that NO LONGER EXISTS in the board_columns table.
    -- This happens if a column was deleted but tasks weren't cascaded or updated.
    -- We set column_id to NULL so they fall back to the Status-based mapping (which we just ensured exists via the defaults above).
    
    UPDATE tasks
    SET column_id = NULL
    WHERE column_id IS NOT NULL 
    AND column_id NOT IN (SELECT id FROM board_columns);
    
    -- Also, strictly for the scenario where tasks are "orphaned" appearing in the new "Safety Net" column:
    -- If a task has no column_id, it relies on status.
    -- If we just inserted the default columns, the frontend will now match them.
    -- So no further SQL action is needed for those specific tasks, just the columns existence is enough.

END $$;
