-- =========================================================================================
-- FORENSIC INVESTIGATION: GHOST USERS
-- =========================================================================================

-- 1. Investigate Specific User: Renan Pianucci
SELECT 
    u.id, 
    u.email, 
    u.full_name, 
    u.organization_id, 
    o.name as organization_name
FROM public.users u
LEFT JOIN public.organizations o ON u.organization_id = o.id
WHERE u.email ILIKE '%renanpianucci%';


-- 2. Audit "MKTNOW - Sede" for suspicious/foreign users
-- Lists everyone in Mktnow Sede, so you can spot others like Renan.
SELECT 
    u.id, 
    u.email, 
    u.full_name, 
    u.role,
    u.created_at
FROM public.users u
WHERE u.organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342' -- ID from previous investigation
ORDER BY u.full_name;


-- 3. Check for any "Orphan" users (NULL Organization) who might be bypassing checks
-- (Should be 0 if the previous fix worked, but let's check)
SELECT count(*) as orphans_count FROM public.users WHERE organization_id IS NULL;


-- 4. Check if Organization 'PASSO' or 'Renan's Org' actually still exists
-- Maybe it wasn't deleted because of a naming mismatch?
SELECT id, name, created_at FROM public.organizations 
WHERE name ILIKE '%Passo%' OR name ILIKE '%Omnitrion%';
