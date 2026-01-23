-- =========================================================================================
-- AUDIT: FIND INTRUDERS IN MKTNOW SEDE
-- =========================================================================================
-- This script lists all users currently assigned to 'MKTNOW - Sede'
-- who DO NOT have 'mktnow' in their email (likely migrated by mistake).
-- =========================================================================================

SELECT 
    id, 
    email, 
    full_name, 
    created_at,
    last_sign_in_at
FROM public.users 
WHERE organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342' -- Mktnow Sede ID
AND email NOT ILIKE '%mktnow%'  -- Filter: Show only "outsiders"
ORDER BY full_name;

-- Summary Count
SELECT count(*) as total_intruders
FROM public.users 
WHERE organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342'
AND email NOT ILIKE '%mktnow%';
