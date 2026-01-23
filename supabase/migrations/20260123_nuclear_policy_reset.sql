-- =========================================================================================
-- NUCLEAR OPTION: POLICY RESET & HARDENING
-- =========================================================================================
-- Objective: Eliminate "Ghost Policies". 
-- Postgres RLS is "Permissive" (OR logic). If ONE old policy says "Allowed", the leak happens.
-- This script blindly drops EVERY known legacy policy name.
-- =========================================================================================

BEGIN;

-- -----------------------------------------------------------------------------------------
-- 1. TASKS (The Leak Point)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- DROP EVERYTHING (Known Legacy Names)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.tasks;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_select_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_insert_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_delete_tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks Isolation" ON public.tasks; -- Dropping current to recreate

-- RE-APPLY STRICT ISOLATION
CREATE POLICY "Tasks Isolation" ON public.tasks
FOR ALL
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 2. PROJECTS
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
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 3. CLIENTS
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_select_clients" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_insert_clients" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_update_clients" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_delete_clients" ON public.clients;
DROP POLICY IF EXISTS "Clients Isolation" ON public.clients;

CREATE POLICY "Clients Isolation" ON public.clients
FOR ALL
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 4. BOARDS
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_select_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_insert_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_update_boards" ON public.boards;
DROP POLICY IF EXISTS "org_isolation_delete_boards" ON public.boards;
DROP POLICY IF EXISTS "Boards Isolation" ON public.boards;

CREATE POLICY "Boards Isolation" ON public.boards
FOR ALL
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());

COMMIT;
