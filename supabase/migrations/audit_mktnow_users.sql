-- Audit: List all members of MKTNOW - Sede
-- Check if there are users here who SHOULD NOT be here.
-- The ID 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342' is MKTNOW - Sede

SELECT 
    u.email, 
    u.full_name, 
    u.created_at,
    CASE 
        WHEN u.organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342' THEN 'MKTNOW - Sede'
        ELSE 'OUTRA'
    END as status
FROM public.users u
WHERE u.organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342'
ORDER BY u.full_name;
