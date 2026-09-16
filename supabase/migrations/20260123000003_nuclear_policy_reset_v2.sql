-- =========================================================================================
-- NUCLEAR OPTION V2: THE SPECIFIC TARGETS
-- =========================================================================================
-- Objective: Eliminated 'Ghost Policies' identified from previous migration files.
-- Found: 'policy_admins_view_all_tasks', 'Allow delete for Admins...', 'policy_super_admin...'
-- These policies are likely bypassing the Organization Lock.
-- =========================================================================================

BEGIN;

-- 1. TASKS (Clean Specific Leaks)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_admins_view_all_tasks" ON public.tasks;
DROP POLICY IF EXISTS "policy_admins_update_all_tasks" ON public.tasks;
DROP POLICY IF EXISTS "policy_admins_delete_all_tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for Admins or Manager Owners" ON public.tasks;
DROP POLICY IF EXISTS "policy_super_admin_view_all_tasks" ON public.tasks;

-- 2. PROJECTS (Clean Specific Leaks)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_super_admin_view_all_projects" ON public.projects;

-- 3. CLIENTS (Clean Specific Leaks)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_super_admin_view_all_clients" ON public.clients;

-- 4. BOARDS (Clean Specific Leaks)
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_super_admin_view_all_boards" ON public.boards;

-- 5. USERS (Clean Specific Leaks)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_super_admin_view_all_users" ON public.users;

-- 6. TIME LOGS (Clean Specific Leaks)
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_super_admin_view_all_timelogs" ON public.time_logs;

COMMIT;
