-- =========================================================================================
-- FINAL DIAGNOSTIC: THE SMOKING GUN
-- =========================================================================================

-- 1. DETECT ACTIVE POLICIES (The most likely culprit)
-- If you see ANY policy here besides 'Tasks Isolation', that is why the data leaks.
-- Look for: "Enable read access for all" or "Authenticated users..."
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'tasks';


-- 2. INSPECT THE TEST USER (The alternative culprit)
-- If the Policies are clean (only 'Tasks Isolation'), then the User MUST have the wrong Org ID.
-- Check if 'db_org_id' matches the ID from your screenshot (fec68b...).
SELECT 
    au.email, 
    au.raw_app_meta_data->>'organization_id' as jwt_org_id,
    pu.organization_id as db_org_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 5;

-- 3. TEST RLS FUNCTION LOCALLY
-- This simulates what the database sees for the current SQL Editor user
-- It will likely be NULL for you (as postgres superuser), which is expected.
SELECT public.get_my_org_id() as my_current_org_context;
