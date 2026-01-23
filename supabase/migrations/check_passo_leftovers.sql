-- =========================================================================================
-- CHECK FOR SPECIFIC 'PASSO' USERS IN MKTNOW
-- =========================================================================================

SELECT 
    id, 
    email, 
    full_name, 
    created_at
FROM public.users 
WHERE organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342' -- Mktnow Sede
AND (
    email ILIKE '%passo%' 
    OR 
    email ILIKE '%renan%' -- Double check Renan
);

-- Total count
SELECT count(*) as total_passo_ghosts
FROM public.users 
WHERE organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342'
AND (email ILIKE '%passo%' OR email ILIKE '%renan%');
