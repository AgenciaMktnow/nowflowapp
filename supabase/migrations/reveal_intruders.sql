-- =========================================================================================
-- REVEAL INTRUDERS
-- =========================================================================================

SELECT 
    full_name, 
    email,
    id,
    created_at
FROM public.users 
WHERE organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342' -- Mktnow Sede
AND email NOT ILIKE '%mktnow%';
