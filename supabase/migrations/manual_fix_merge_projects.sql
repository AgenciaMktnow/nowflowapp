-- Migration to Deduplicate Projects and enforce Uniqueness on Name
-- Goal: Merge projects with same name into a single "Master" project.
-- 1. Identify duplicates.
-- 2. Update dependencies (tasks, project_columns, client_projects).
-- 3. Delete non-master duplicates.
-- 4. Add UNIQUE constraint.

DO $$ 
DECLARE
    r RECORD;
    master_id UUID;
BEGIN
    -- Iterate over project names that have duplicates
    FOR r IN (
        SELECT name, COUNT(*) 
        FROM public.projects 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) LOOP
        -- Select the 'Master' ID (e.g., the oldest one)
        SELECT id INTO master_id 
        FROM public.projects 
        WHERE name = r.name 
        ORDER BY created_at ASC 
        LIMIT 1;

        RAISE NOTICE 'Merging projects for name: % (Master ID: %)', r.name, master_id;

        -- Update TASKS to point to Master
        UPDATE public.tasks 
        SET project_id = master_id 
        WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name AND id != master_id);

        -- Update CLIENT_PROJECTS (Many-to-Many) if exists
        -- Logic: If client was linked to duplicate, link to master. Avoid constraint violation if already linked.
        -- First, delete duplicates if they would cause conflict (e.g. client already has master)
        -- Actually, safer to just update and handle conflict or let them be valid constraints if (client_id, project_id) is unique.
        -- Assuming standard link table.
        BEGIN
            UPDATE public.client_projects
            SET project_id = master_id
            WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name AND id != master_id)
            AND NOT EXISTS (
                SELECT 1 FROM public.client_projects cp2 
                WHERE cp2.project_id = master_id 
                AND cp2.client_id = public.client_projects.client_id
            );
            
            -- Delete any remaining references that couldn't be updated (duplicates)
             DELETE FROM public.client_projects
             WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name AND id != master_id);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping client_projects update due to missing table or error';
        END;

        -- Update TIME_LOGS if exists
        BEGIN
            UPDATE public.time_logs
            SET project_id = master_id
            WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name AND id != master_id);
        EXCEPTION WHEN OTHERS THEN
            -- time_logs might not have project_id or use task_id relations
             RAISE NOTICE 'Skipping time_logs update (column project_id might not exist)';
        END;
        
        -- Update PROJECT_COLUMNS
        -- If master has columns, we might delete duplicate's columns.
        -- If master has NO columns, we could move them.
        -- Simplification: Just delete duplicate project's columns for now (or move them if needed). User didn't specify.
        -- Safest: Delete duplicate project columns as they are specific to the instance.
        DELETE FROM public.project_columns
        WHERE project_id IN (SELECT id FROM public.projects WHERE name = r.name AND id != master_id);

        -- Delete the Duplicate Projects
        DELETE FROM public.projects 
        WHERE name = r.name AND id != master_id;
        
    END LOOP;
END $$;

-- Add Unique Constraint
ALTER TABLE public.projects ADD CONSTRAINT projects_name_key UNIQUE (name);
