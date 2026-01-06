-- Additive RLS Policies for Queue Visibility
-- This script ADDS new permissions without removing existing ones.
-- It ensures Assignees can see their Tasks and the parent Projects of those tasks.

-- 1. Tasks: Allow Assignees to View
-- "If I am assigned to it, I can see it."
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'policy_tasks_view_assigned'
    ) THEN
        CREATE POLICY "policy_tasks_view_assigned"
        ON public.tasks
        FOR SELECT
        USING (auth.uid() = assignee_id);
    END IF;
END
$$;

-- 2. Tasks: Allow Assignees to Update
-- "If I am assigned to it, I can update it (status, etc)."
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'policy_tasks_update_assigned'
    ) THEN
        CREATE POLICY "policy_tasks_update_assigned"
        ON public.tasks
        FOR UPDATE
        USING (auth.uid() = assignee_id);
    END IF;
END
$$;

-- 3. Projects: Allow Visibility of Parent Projects
-- "If a Project has a task assigned to me, I need to see the Project to render the card correctly."
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'policy_projects_view_by_task_assignee'
    ) THEN
        CREATE POLICY "policy_projects_view_by_task_assignee"
        ON public.projects
        FOR SELECT
        USING (
            id IN (
                SELECT project_id 
                FROM public.tasks 
                WHERE assignee_id = auth.uid()
            )
        );
    END IF;
END
$$;
