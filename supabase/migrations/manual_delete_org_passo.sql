-- =========================================================================================
-- MANUAL DELETION: Organization "PASSO"
-- =========================================================================================

DO $$
DECLARE
    v_target_org_id UUID;
    v_org_name TEXT;
BEGIN
    -- 1. Find the Organization
    SELECT id, name INTO v_target_org_id, v_org_name 
    FROM public.organizations 
    WHERE name ILIKE 'PASSO' 
    LIMIT 1;

    IF v_target_org_id IS NULL THEN
        RAISE NOTICE 'Organization "PASSO" not found. Nothing to delete.';
        RETURN;
    END IF;

    RAISE NOTICE 'Deleting Organization: % (ID: %)...', v_org_name, v_target_org_id;

    -- 2. Delete Dependencies (Cascading Order)
    
    -- Time Logs
    DELETE FROM public.time_logs WHERE organization_id = v_target_org_id;
    
    -- Task Comments (via Tasks)
    DELETE FROM public.task_comments WHERE task_id IN (SELECT id FROM public.tasks WHERE organization_id = v_target_org_id);
    
    -- Task Activities (via Tasks)
    DELETE FROM public.task_activities WHERE task_id IN (SELECT id FROM public.tasks WHERE organization_id = v_target_org_id);
    
    -- Task Attachments (via Tasks)
    DELETE FROM public.task_attachments WHERE task_id IN (SELECT id FROM public.tasks WHERE organization_id = v_target_org_id);

    -- Tasks
    DELETE FROM public.tasks WHERE organization_id = v_target_org_id;

    -- Projects
    DELETE FROM public.projects WHERE organization_id = v_target_org_id;

    -- Boards & Columns
    DELETE FROM public.board_columns bc USING public.boards b WHERE bc.board_id = b.id AND b.organization_id = v_target_org_id;
    DELETE FROM public.boards WHERE organization_id = v_target_org_id;

    -- Teams
    DELETE FROM public.teams WHERE organization_id = v_target_org_id;

    -- Invitations
    DELETE FROM public.invitations WHERE organization_id = v_target_org_id;
    
    -- Clients (Forgot this in the original RPC? Adding it here for safety)
    DELETE FROM public.clients WHERE organization_id = v_target_org_id;

    -- Users (Public profile layer)
    DELETE FROM public.users WHERE organization_id = v_target_org_id;

    -- 3. The Organization itself
    DELETE FROM public.organizations WHERE id = v_target_org_id;

    RAISE NOTICE 'Deletion Complete for Organization: %', v_org_name;
END $$;
