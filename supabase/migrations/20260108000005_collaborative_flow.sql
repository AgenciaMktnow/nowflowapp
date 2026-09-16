-- =========================================================================================
-- COLLABORATIVE TASK FLOW MIGRATION
-- 1. Schema: Add completed_at to task_assignees.
-- 2. RPC: toggle_task_assignee_completion (Handles "My Part" & Auto-Complete).
-- 3. RPC: reopen_task (Reset status & clear completions).
-- =========================================================================================

-- 1. ADD COLUMN
ALTER TABLE public.task_assignees 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. RPC: TOGGLE COMPLETION (My Part)
CREATE OR REPLACE FUNCTION public.toggle_task_assignee_completion(
    p_task_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_completed_at TIMESTAMP WITH TIME ZONE;
    v_all_completed BOOLEAN;
    v_total_assignees INT;
    v_completed_count INT;
    v_task_title TEXT;
    v_new_status TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if user is assigned
    IF NOT EXISTS (SELECT 1 FROM public.task_assignees WHERE task_id = p_task_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'User is not assigned to this task.';
    END IF;

    -- Toggle Logic
    SELECT completed_at INTO v_completed_at 
    FROM public.task_assignees 
    WHERE task_id = p_task_id AND user_id = v_user_id;

    IF v_completed_at IS NOT NULL THEN
        -- Undo completion
        UPDATE public.task_assignees SET completed_at = NULL 
        WHERE task_id = p_task_id AND user_id = v_user_id;
    ELSE
        -- Mark as completed
        UPDATE public.task_assignees SET completed_at = now() 
        WHERE task_id = p_task_id AND user_id = v_user_id;
    END IF;

    -- CHECK AUTO-COMPLETION
    SELECT count(*), count(completed_at) 
    INTO v_total_assignees, v_completed_count
    FROM public.task_assignees 
    WHERE task_id = p_task_id;

    IF v_total_assignees > 0 AND v_total_assignees = v_completed_count THEN
        -- ALL COMPLETED -> AUTO DONE
        UPDATE public.tasks SET status = 'DONE' WHERE id = p_task_id;
        v_new_status := 'DONE';
        
        -- Optional: Notify? The handle_task_movement trigger will likely fire 'Task Completed'
    ELSE
        v_new_status := 'IN_PROGRESS'; 
        -- Ensure it's not waiting client or something else? 
        -- Keeping current status is safer unless we want to force IN_PROGRESS.
        -- Let's leave status as is, just return stats.
    END IF;

    RETURN jsonb_build_object(
        'status', v_new_status,
        'total', v_total_assignees,
        'completed', v_completed_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_task_assignee_completion(UUID) TO authenticated;


-- 3. RPC: REOPEN TASK
CREATE OR REPLACE FUNCTION public.reopen_task(
    p_task_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check Permissions (Admin or Manager) -- Or maybe just let the caller handle UI checks?
    -- Good practice to check DB side.
    SELECT role INTO v_user_role FROM public.users WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('ADMIN', 'MANAGER') THEN
         -- Optional: Allow Creator to reopen?
         IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE id = p_task_id AND created_by = auth.uid()) THEN
            RAISE EXCEPTION 'Permission Denied: Only Admins, Managers or Creator can reopen tasks.';
         END IF;
    END IF;

    -- 1. Reset Assignee Completions (Clear completed_at)
    UPDATE public.task_assignees 
    SET completed_at = NULL 
    WHERE task_id = p_task_id;

    -- 2. Update Task Status -> IN_PROGRESS
    UPDATE public.tasks 
    SET status = 'IN_PROGRESS' 
    WHERE id = p_task_id;

    -- 3. Notification will be handled by 'handle_task_movement' (We added adjustment logic there!)

END;
$$;

GRANT EXECUTE ON FUNCTION public.reopen_task(UUID) TO authenticated;
