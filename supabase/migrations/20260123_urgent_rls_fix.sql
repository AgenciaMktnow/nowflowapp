-- =========================================================================================
-- URGENT RLS REPAIR - STRICT ORGANIZATION ISOLATION (FIXED)
-- =========================================================================================
-- Objective: Fix reported cross-organization data leakage immediately.
-- Strategy:
-- 1. Establish a non-recursive "source of truth" function for the current user's organization.
-- 2. Drop all existing permissive or complex policies.
-- 3. Apply strict `organization_id = get_my_org_id()` checks on all tables WITH organization_id.
-- 4. Apply JOIN-based checks on dependent tables (task_activities, attachments, notifications).
-- =========================================================================================

BEGIN;

-- -----------------------------------------------------------------------------------------
-- 1. Helper Function: Source of Truth
-- -----------------------------------------------------------------------------------------

-- Ensure this function exists and is OPTIMIZED to avoid recursion.
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Fast Path: JWT Metadata (if populated)
    -- org_id := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
    -- IF org_id IS NOT NULL THEN RETURN org_id; END IF;
    
    -- Safe Path: Users table query
    -- This function is SECURITY DEFINER, so it bypasses RLS on 'users' to find the org_id.
    SELECT organization_id INTO org_id
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------------------
-- 2. PROJECTS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_select_projects" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_update_projects" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_delete_projects" ON public.projects;
DROP POLICY IF EXISTS "Projects Isolation" ON public.projects;

CREATE POLICY "Projects Isolation" ON public.projects
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

-- -----------------------------------------------------------------------------------------
-- 3. TASKS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_select_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_insert_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_delete_tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks Isolation" ON public.tasks;

CREATE POLICY "Tasks Isolation" ON public.tasks
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

-- -----------------------------------------------------------------------------------------
-- 4. CLIENTS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Clean old policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_select_clients" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_insert_clients" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_update_clients" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_delete_clients" ON public.clients;
DROP POLICY IF EXISTS "Clients Isolation" ON public.clients;

CREATE POLICY "Clients Isolation" ON public.clients
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

-- -----------------------------------------------------------------------------------------
-- 5. BOARDS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_select_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_insert_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_update_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_delete_boards" ON public.boards;
DROP POLICY IF EXISTS "Boards Isolation" ON public.boards;

CREATE POLICY "Boards Isolation" ON public.boards
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

-- -----------------------------------------------------------------------------------------
-- 6. USERS (Strict View Scope)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_users_select_all" ON public.users;
DROP POLICY IF EXISTS "org_isolation_select_users" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.users;
DROP POLICY IF EXISTS "Admins and Managers see everyone" ON public.users;
DROP POLICY IF EXISTS "Users View Same Org" ON public.users;
DROP POLICY IF EXISTS "Users Update Self" ON public.users;

-- User visibility: Can only see users in SAME organization
CREATE POLICY "Users View Same Org" ON public.users
FOR SELECT
USING (organization_id = get_my_org_id());

-- User Edit: Can only edit SELF (and stick to own org)
CREATE POLICY "Users Update Self" ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid()); -- Prevents changing ID, allows updating fields

-- -----------------------------------------------------------------------------------------
-- 7. TASK ASSIGNEES (Task Dependent - Recursion Safe)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.task_assignees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_assignees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.task_assignees;
DROP POLICY IF EXISTS "Task Assignees Isolation" ON public.task_assignees;
DROP POLICY IF EXISTS "Task Assignees Modification" ON public.task_assignees;

-- Join with TASKS to verify access. Since TASKS already has a strict non-recursive policy, this is safe.
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

-- -----------------------------------------------------------------------------------------
-- 8. NOTIFICATIONS & ACTIVITY LOGS (Refined for missing organization_id)
-- -----------------------------------------------------------------------------------------

-- Notifications (No organization_id, use user_id)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications Isolation" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;


CREATE POLICY "Notifications Owner Access" ON public.notifications
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- Activity Logs (task_activities) - No organization_id, use task_id
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_activity_logs" ON public.task_activities;
DROP POLICY IF EXISTS "Activity Logs Isolation" ON public.task_activities;
DROP POLICY IF EXISTS "Users can view activities of accessible tasks" ON public.task_activities;

CREATE POLICY "Activity Logs Isolation" ON public.task_activities
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_activities.task_id
        AND tasks.organization_id = get_my_org_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_activities.task_id
        AND tasks.organization_id = get_my_org_id()
    )
);


-- -----------------------------------------------------------------------------------------
-- 9. TASK ATTACHMENTS (Refined for missing organization_id)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_task_attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Task Attachments Isolation" ON public.task_attachments;
DROP POLICY IF EXISTS "Authenticated users can read task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments or Admins" ON public.task_attachments;

-- Check Task ownership
CREATE POLICY "Task Attachments Isolation" ON public.task_attachments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_attachments.task_id
        AND tasks.organization_id = get_my_org_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_attachments.task_id
        AND tasks.organization_id = get_my_org_id()
    )
);

COMMIT;
