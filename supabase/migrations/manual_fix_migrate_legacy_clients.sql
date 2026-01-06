-- CLEANUP LEGACY: Move remaining projects.client_id to client_projects
-- 1. Insert into client_projects (Using NOT EXISTS to avoid constraint inference issues)
-- 2. Nullify projects.client_id

BEGIN;

DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Starting Legacy Project Cleanup...';

    -- 1. Migrate existing links to client_projects
    -- Refactored to use WHERE NOT EXISTS instead of ON CONFLICT to bypass specific constraint name/index matching issues through nulls.
    
    INSERT INTO public.client_projects (client_id, project_id, board_id)
    SELECT p.client_id, p.id, p.board_id
    FROM public.projects p
    WHERE p.client_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.client_projects cp 
          WHERE cp.client_id = p.client_id 
            AND cp.project_id = p.id 
            AND (cp.board_id = p.board_id OR (cp.board_id IS NULL AND p.board_id IS NULL))
      );
    
    -- 2. Clean up the projects table
    UPDATE public.projects
    SET client_id = NULL
    WHERE client_id IS NOT NULL;
    
    RAISE NOTICE 'Legacy Cleanup Complete. Projects table is now Global-only (client_id=NULL).';
END $$;

COMMIT;
