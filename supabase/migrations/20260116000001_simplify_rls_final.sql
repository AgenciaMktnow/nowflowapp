-- =========================================================================================
-- SIMPLIFIED RLS & RECURSION FIX (FINAL)
-- =========================================================================================
-- Objective: Remove complex/recursive policies and implement a single, stable source of truth
-- for organization isolation.
-- =========================================================================================

BEGIN;

-- 1. Helper Function: Stable Organization ID Check (Non-Recursive)
-- We use auth.jwt() first if available (fastest), or fallback to users table safely.
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Optimized: Try to get from metadata first (if your auth setup puts it there)
    -- org_id := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
    
    -- If not in JWT, query users table specifically avoid recursion by NOT having a policy on this function's execution context
    -- However, since this function is SECURITY DEFINER, it bypasses RLS on the users table when searching.
    SELECT organization_id INTO org_id
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Drop OLD Policies (Clean Slate)
-- TASKS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_select_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_insert_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_delete_tasks" ON public.tasks;

-- USERS
DROP POLICY IF EXISTS "authenticated_users_select_all" ON public.users;
DROP POLICY IF EXISTS "org_isolation_select_users" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.users;
DROP POLICY IF EXISTS "Admins and Managers see everyone" ON public.users;

-- PROJECTS
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_select_projects" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_update_projects" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_delete_projects" ON public.projects;

-- TASK_ASSIGNEES (Often forgotten)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.task_assignees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_assignees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.task_assignees;


-- 3. Apply NEW Simplified Policies
-- "One Rule to Rule Them All": organization_id must match get_my_org_id()

-- TASKS
CREATE POLICY "Tasks Isolation" ON public.tasks
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

-- PROJECTS
CREATE POLICY "Projects Isolation" ON public.projects
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

-- USERS
-- Logic: I can see everyone in my org. I can only edit myself.
CREATE POLICY "Users View Same Org" ON public.users
FOR SELECT
USING (organization_id = get_my_org_id());

CREATE POLICY "Users Update Self" ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid()); -- Prevent changing one's own ID/Org via this policy if needed, or allow if safe.

-- TASK_ASSIGNEES
-- This table usually lacks organization_id, so we check via the TASK.
-- If task_assignees DOES NOT have organization_id, we must join. 
-- BUT, since we simplified Tasks policy, we can just check if the user has access to the task.
-- However, for performance and to avoid join-recursion, best practice is to RLS the task_assignees too via join or simply allow if you can see the task.
-- Let's check if task_assignees has org_id. If not, we rely on task verify. 
-- Assuming standard usage:
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task Assignees Isolation" ON public.task_assignees
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_assignees.task_id
        AND tasks.organization_id = get_my_org_id()
    )
);

CREATE POLICY "Task Assignees Modification" ON public.task_assignees
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_assignees.task_id
        AND tasks.organization_id = get_my_org_id()
    )
);

-- 4. BOARDS (Bonus: Ensure consistency)
DROP POLICY IF EXISTS "org_isolation_select_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_insert_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_update_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_delete_boards" ON public.boards;

CREATE POLICY "Boards Isolation" ON public.boards
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

-- 5. Fix Task Insert Trigger (Optional safety net)
-- We replace the old recursion-prone trigger with one that uses our stable function or just keeps safe.
-- Actually, if frontend sends ID, trigger isn't needed. But let's fix it to be safe.
CREATE OR REPLACE FUNCTION public.set_current_org_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id IS NULL THEN
        NEW.organization_id := public.get_my_org_id();
        IF NEW.organization_id IS NULL THEN
             RAISE EXCEPTION 'User not assigned to an organization.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
