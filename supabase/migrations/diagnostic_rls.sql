-- =========================================================================================
-- DIAGNOSTIC: RLS & DATA INTEGRITY CHECK
-- =========================================================================================

-- 1. Check Active Policies on TASKS
-- Verify if there are any "permissive" policies left (e.g., "Enable read for all").
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 2. Check User Organization Distribution
-- See how many users are in each organization.
SELECT 
    o.name as organization_name, 
    o.id as organization_id, 
    count(u.id) as user_count 
FROM public.users u
LEFT JOIN public.organizations o ON u.organization_id = o.id
GROUP BY o.name, o.id;

-- 3. Check for "Orphan" Users or Suspicious Mappings
-- Are there users seeing data they shouldn't? 
-- (You can manually cross-check these IDs with who is complaining)
SELECT email, full_name, organization_id 
FROM public.users 
ORDER BY organization_id;

-- 4. Check 'Mktnow Sede' ID specifically
SELECT id, name FROM public.organizations WHERE name ILIKE '%Mktnow%';
