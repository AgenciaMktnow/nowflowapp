-- =========================================================================================
-- GOD MODE RLS POLICIES
-- Allows Super Admins (defined by is_super_admin()) to SELECT data from any organization
-- =========================================================================================

BEGIN;

-- 1. Tasks Table (Read Access)
DROP POLICY IF EXISTS "policy_super_admin_view_all_tasks" ON public.tasks;
CREATE POLICY "policy_super_admin_view_all_tasks" ON public.tasks FOR SELECT
USING (public.is_super_admin());

-- 2. Projects Table (Read Access)
DROP POLICY IF EXISTS "policy_super_admin_view_all_projects" ON public.projects;
CREATE POLICY "policy_super_admin_view_all_projects" ON public.projects FOR SELECT
USING (public.is_super_admin());

-- 3. Clients Table (Read Access)
DROP POLICY IF EXISTS "policy_super_admin_view_all_clients" ON public.clients;
CREATE POLICY "policy_super_admin_view_all_clients" ON public.clients FOR SELECT
USING (public.is_super_admin());

-- 4. Boards Table (Read Access)
DROP POLICY IF EXISTS "policy_super_admin_view_all_boards" ON public.boards;
CREATE POLICY "policy_super_admin_view_all_boards" ON public.boards FOR SELECT
USING (public.is_super_admin());

-- 5. Users Table (Read Access)
DROP POLICY IF EXISTS "policy_super_admin_view_all_users" ON public.users;
CREATE POLICY "policy_super_admin_view_all_users" ON public.users FOR SELECT
USING (public.is_super_admin());

-- 6. Time Logs (Read Access)
DROP POLICY IF EXISTS "policy_super_admin_view_all_timelogs" ON public.time_logs;
CREATE POLICY "policy_super_admin_view_all_timelogs" ON public.time_logs FOR SELECT
USING (public.is_super_admin());

COMMIT;
