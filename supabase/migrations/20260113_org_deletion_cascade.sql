-- =========================================================================================
-- SUPER-ADMIN: TOTAL ORGANIZATION DELETION (CASCADING)
-- Deletes all data associated with an organization in the correct dependency order.
-- Returns a summary of deleted records.
-- =========================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.delete_organization_cascade(target_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_counts JSONB;
    v_time_logs_count INT := 0;
    v_tasks_count INT := 0;
    v_projects_count INT := 0;
    v_boards_count INT := 0;
    v_users_count INT := 0;
    v_invites_count INT := 0;
    v_teams_count INT := 0;
    v_comments_count INT := 0;
    v_org_name TEXT;
BEGIN
    -- 1. Security Check: Only Super Admins!
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas Super Admins podem deletar organizações.';
    END IF;

    -- Get Org Name for Log / Verification
    SELECT name INTO v_org_name FROM public.organizations WHERE id = target_org_id;
    IF v_org_name IS NULL THEN
        RAISE EXCEPTION 'Organização não encontrada (ID: %)', target_org_id;
    END IF;

    -- 2. Cascading Deletion

    -- A. Time Logs
    DELETE FROM public.time_logs WHERE organization_id = target_org_id;
    GET DIAGNOSTICS v_time_logs_count = ROW_COUNT;

    -- B. Task Sub-entities (Comments, Activities, Attachments)
    -- We delete via Join to ensure we hit everything linked to tasks of that org
    DELETE FROM public.task_comments WHERE task_id IN (SELECT id FROM public.tasks WHERE organization_id = target_org_id);
    GET DIAGNOSTICS v_comments_count = ROW_COUNT;
    
    DELETE FROM public.task_activities WHERE task_id IN (SELECT id FROM public.tasks WHERE organization_id = target_org_id);
    DELETE FROM public.task_attachments WHERE task_id IN (SELECT id FROM public.tasks WHERE organization_id = target_org_id);

    -- C. Tasks
    DELETE FROM public.tasks WHERE organization_id = target_org_id;
    GET DIAGNOSTICS v_tasks_count = ROW_COUNT;

    -- D. Projects & Boards
    DELETE FROM public.projects WHERE organization_id = target_org_id;
    GET DIAGNOSTICS v_projects_count = ROW_COUNT;

    DELETE FROM public.boards WHERE organization_id = target_org_id;
    GET DIAGNOSTICS v_boards_count = ROW_COUNT;

    DELETE FROM public.board_columns bc USING public.boards b WHERE bc.board_id = b.id AND b.organization_id = target_org_id;

    -- E. Teams
    DELETE FROM public.teams WHERE organization_id = target_org_id;
    GET DIAGNOSTICS v_teams_count = ROW_COUNT;

    -- F. Invitations
    DELETE FROM public.invitations WHERE organization_id = target_org_id;
    GET DIAGNOSTICS v_invites_count = ROW_COUNT;

    -- G. Users (Profiles)
    -- Note: This only deletes from public.users. Auth.users remains (standard practice for safety).
    DELETE FROM public.users WHERE organization_id = target_org_id;
    GET DIAGNOSTICS v_users_count = ROW_COUNT;

    -- H. The Organization itself
    DELETE FROM public.organizations WHERE id = target_org_id;

    -- 3. Return Summary
    v_counts := jsonb_build_object(
        'org_name', v_org_name,
        'time_logs', v_time_logs_count,
        'tasks', v_tasks_count,
        'projects', v_projects_count,
        'boards', v_boards_count,
        'users', v_users_count,
        'invitations', v_invites_count,
        'teams', v_teams_count,
        'comments', v_comments_count,
        'total_records', v_time_logs_count + v_tasks_count + v_projects_count + v_boards_count + v_users_count + v_invites_count + v_teams_count + v_comments_count
    );

    RETURN v_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
