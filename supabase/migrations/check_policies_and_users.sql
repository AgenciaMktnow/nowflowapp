-- =========================================================================================
-- DIAGNOSTIC: POLICIES & USER LINKS (Focused)
-- =========================================================================================
-- Please run this and look at the "Results" table.

-- 1. CHECK FOR GHOST POLICIES
-- Only "Tasks Isolation" should be here. 
-- Any policy named "Enable read access for all..." is the LEAK.
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 2. CHECK THE TEST USER
-- Look at the row for your "Teste" user.
-- Does 'db_org_id' match the MKTNOW ID (fec68...)?
SELECT 
    email, 
    raw_app_meta_data->>'organization_id' as jwt_org, 
    organization_id as db_org 
FROM public.users -- using public.users view which joins auth
ORDER BY created_at DESC 
LIMIT 5;
