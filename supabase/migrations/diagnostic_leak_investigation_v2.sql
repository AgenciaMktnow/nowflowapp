-- =========================================================================================
-- DIAGNOSTIC: RLS LEAK FORENSICS (v2 - Fixed)
-- =========================================================================================

-- 1. CHECK RLS STATUS
-- Is RLS actually ENABLED on tasks? (Should be 'true')
SELECT relname, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'tasks';

-- 2. LIST ALL ACTIVE POLICIES ON TASKS
-- Look for any policy that isn't "Tasks Isolation".
-- If you see "Enable read access for all users", THAT is the leak.
SELECT schemaname, tablename, policyname, substring(cmd::text, 1, 10) as cmd, roles, permissive 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 3. INSPECT THE NEW TEST USER (Auth & Public)
-- We check what Organization ID the system thinks they have.
SELECT 
    au.email, 
    au.created_at,
    -- Check Metadata in Auth (The source for JWT)
    au.raw_app_meta_data->>'organization_id' as jwt_org_id,
    -- Check Public Profile (The source for Database)
    pu.organization_id as db_org_id,
    pu.role as user_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 5;

-- 4. CHECK TASK DATA HEALTH
-- Do tasks have Organization IDs? Or are they NULL?
SELECT 
    organization_id, 
    count(*) as total_tasks,
    (SELECT name FROM public.organizations WHERE id = tasks.organization_id) as org_name
FROM public.tasks
GROUP BY organization_id;
