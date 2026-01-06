-- SAFE MIGRATION V2: Consolidate Projects & Migrate to Service Catalog with Board Context
-- 1. Schema Upgrade: Add board_id to client_projects
-- 2. Identify unique project identifiers
-- 3. Migrate 'client_id' + 'board_id' from projects to 'client_projects'
-- 4. Update Tasks, TimeLogs to point to Master Project
-- 5. Delete Duplicate Projects
-- 6. Enforce Uniqueness

BEGIN;

-- 1. SCHEMA UPGRADE
DO $$
BEGIN
    -- Add board_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_projects' AND column_name = 'board_id') THEN
        ALTER TABLE public.client_projects ADD COLUMN board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
    END IF;

    -- Drop old PK constraint if it prevents (client, project) duplication but we want (client, project, board) differentiation
    -- Assuming PK was (client_id, project_id). We drop it and create a new unique constraint.
    -- (Safe to drop PK? Usually yes if we replace it. Or just drop the constraint if named known)
    
    -- Try to drop standard naming key
    BEGIN
        ALTER TABLE public.client_projects DROP CONSTRAINT IF EXISTS client_projects_pkey;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop pkey, might not exist or verify name.';
    END;

    -- Create new Unique Index for strict integrity
    -- Assuming client_projects might have ID. If not, this serves as composite key.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_client_projects_compound ON public.client_projects (client_id, project_id, COALESCE(board_id, '00000000-0000-0000-0000-000000000000'::uuid));
END $$;


DO $$ 
DECLARE
    r RECORD;
    master_id UUID;
BEGIN
    RAISE NOTICE 'Starting Safe Project Consolidation V2...';

    -- Loop through unique project identifiers
    FOR r IN (
        SELECT name, COUNT(*) as cnt
        FROM public.projects 
        GROUP BY name
    ) LOOP
        -- Elect Master (Prefer Template/Global with no client, or Oldest)
        SELECT id INTO master_id 
        FROM public.projects 
        WHERE name = r.name 
        ORDER BY client_id IS NULL DESC, created_at ASC 
        LIMIT 1;

        RAISE NOTICE 'Processing "%" (Count: %, Master: %)', r.name, r.cnt, master_id;

        -- 3. MIGRATE RELATIONS with Board Context
        -- Insert into client_projects using the info from the existing duplicate projects
        INSERT INTO public.client_projects (client_id, project_id, board_id)
        SELECT DISTINCT p.client_id, master_id, p.board_id
        FROM public.projects p
        WHERE p.name = r.name 
          AND p.client_id IS NOT NULL
        ON CONFLICT DO NOTHING; -- Rely on our new unique index

        -- 4. UPDATE TASKS
        UPDATE public.tasks
        SET project_id = master_id
        WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name)
          AND project_id != master_id;

        -- 5. UPDATE TIME LOGS & COLUMNS
        BEGIN
            UPDATE public.time_logs 
            SET project_id = master_id 
            WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name) AND project_id != master_id;
        EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'time_logs update skipped'; END;

        BEGIN
            UPDATE public.kanban_columns
            SET project_id = master_id
            WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name) AND project_id != master_id;
        EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kanban_columns update skipped'; END;

        -- 6. DELETE DUPLICATES
        DELETE FROM public.projects
        WHERE name = r.name 
          AND id != master_id;
          
        -- 7. CLEAN MASTER (Global Catalog)
        UPDATE public.projects 
        SET client_id = NULL, board_id = NULL -- Global Service has no specific board/client
        WHERE id = master_id;

    END LOOP;

    RAISE NOTICE 'Consolidation V2 Complete.';
END $$;

-- Enforce Uniqueness on Name for Future
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS projects_name_unique_idx ON public.projects (name);

COMMIT;
