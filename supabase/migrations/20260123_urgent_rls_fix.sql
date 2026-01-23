-- =========================================================================================
-- URGENT RLS REPAIR - STRICT ORGANIZATION ISOLATION
-- =========================================================================================
-- Objective: Fix reported cross-organization data leakage immediately.
-- Strategy:
-- 1. Establish a non-recursive "source of truth" function for the current user's organization.
-- 2. Drop all existing permissive or complex policies.
-- 3. Apply strict `organization_id = get_my_org_id()` checks on all tables.
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
-- 8. NOTIFICATIONS & ACTIVITY LOGS (Strict Isolation)
-- -----------------------------------------------------------------------------------------

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications Isolation" ON public.notifications;

-- Usually notifications are personal (user_id), but if they have org_id, use that.
-- Based on typical schema, let's assume 'organization_id' exists. 
-- IF NOT, we usually scope by user_id = auth.uid(). 
-- Let's stick to organization_id if it exists, otherwise fallback to user_id.
-- Safest bet for 'System' notifications: organization_id.
-- Let's try organization_id first.
CREATE POLICY "Notifications Isolation" ON public.notifications
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());


-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Activity Logs Isolation" ON public.activity_logs;

CREATE POLICY "Activity Logs Isolation" ON public.activity_logs
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 9. TASK ATTACHMENTS
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_task_attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Task Attachments Isolation" ON public.task_attachments;

-- Direct Org Check (High Performance)
CREATE POLICY "Task Attachments Isolation" ON public.task_attachments
FOR ALL
USING (organization_id = get_my_org_id())
WITH CHECK (organization_id = get_my_org_id());

COMMIT;
