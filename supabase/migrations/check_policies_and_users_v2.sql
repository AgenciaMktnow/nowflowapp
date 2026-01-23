-- =========================================================================================
-- DIAGNOSTIC: POLICIES & USER LINKS (v2 - Fixed)
-- =========================================================================================

-- 1. CHECK FOR GHOST POLICIES
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 2. CHECK THE TEST USER (Corrected Join)
-- We join auth.users (au) to get the JWT metadata
-- We join public.users (pu) to get the Database ID
SELECT 
    au.email, 
    au.raw_app_meta_data->>'organization_id' as jwt_org, 
    pu.organization_id as db_org 
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC 
LIMIT 5;
