-- =========================================================================================
-- FIX: TRIGGER LOGIC V3 (PREVENT FK VIOLATION 23503)
-- Issue: When a task is deleted, the cascade deletes 'task_assignees'.
-- The trigger 'on_task_assignee_change' fires for the deletion of the assignee.
-- It attempts to insert into 'task_activities'.
-- Since the parent task is being deleted, this insert fails with FK Violation (23503).
-- Solution: In the trigger, check if the task still exists before logging.
-- =========================================================================================

CREATE OR REPLACE FUNCTION public.log_task_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_target_user_name TEXT;
    v_task_exists BOOLEAN;
BEGIN
    v_actor_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
         SELECT full_name INTO v_target_user_name FROM public.users WHERE id = NEW.user_id;
         
         -- Insert safe (Task must exist for Assignee to be inserted)
         INSERT INTO public.task_activities (task_id, user_id, action_type, details)
         VALUES (NEW.task_id, v_actor_id, 'ASSIGNED', jsonb_build_object('assigned_to', v_target_user_name, 'assigned_user_id', NEW.user_id));
         
         RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
         -- CRITICAL FIX: Check if the task actually exists before logging.
         -- During a Cascade Delete of the Task, this check will likely fail or we can interpret context.
         -- Simple existence check:
         SELECT EXISTS(SELECT 1 FROM public.tasks WHERE id = OLD.task_id) INTO v_task_exists;
         
         IF v_task_exists THEN
             SELECT full_name INTO v_target_user_name FROM public.users WHERE id = OLD.user_id;
             
             INSERT INTO public.task_activities (task_id, user_id, action_type, details)
             VALUES (OLD.task_id, v_actor_id, 'UNASSIGNED', jsonb_build_object('removed_user', v_target_user_name, 'removed_user_id', OLD.user_id));
         ELSE
            -- Task is gone or being deleted. Do NOT log.
            -- This allows the Cascade Delete to complete successfully.
            NULL; 
         END IF;

         RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RE-VERIFY FOREIGN KEY (Just to be absolutely sure correct constraint is active)
DO $$
BEGIN
    ALTER TABLE public.task_activities DROP CONSTRAINT IF EXISTS task_activities_task_id_fkey;
    
    ALTER TABLE public.task_activities 
    ADD CONSTRAINT task_activities_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
END $$;
