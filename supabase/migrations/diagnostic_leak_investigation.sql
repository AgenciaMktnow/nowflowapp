-- =========================================================================================
-- DIAGNOSTIC: RLS LEAK FORENSICS
-- =========================================================================================

-- 1. List ALL Active Policies on 'tasks'
-- (If any policy here is "permissive" like 'Enable read access for all...', it explains the leak)
SELECT schemaname, tablename, policyname, cmd, roles, permissive 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 2. Inspect Recent Users (To find the "Agência Teste" user)
-- We want to see if their organization_id is set correctly or not.
SELECT id, email, organization_id, created_at, raw_app_meta_data 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Equivalent check in public.users
SELECT id, email, organization_id, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check Task Organization Distribution
-- Are MKTNOW tasks properly tagged? Or are they NULL?
SELECT 
    organization_id, 
    COUNT(*) as task_count,
    (SELECT name FROM organizations WHERE id = tasks.organization_id) as org_name
FROM public.tasks
GROUP BY organization_id;

-- 5. Test get_my_org_id() Logic for a specific user (Simulation)
-- Replace 'THE_GLITCHED_USER_ID' with the ID found in step 2 if you run this interactively.
-- For now, we trust the listings above to deduce the issue.

-- 6. Check if RLS is ENABLED on tasks
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'tasks';
