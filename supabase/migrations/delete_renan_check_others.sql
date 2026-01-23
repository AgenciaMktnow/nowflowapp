-- =========================================================================================
-- CLEANUP: REMOVE GHOST USERS
-- =========================================================================================

DO $$
DECLARE
    v_renan_id UUID;
    v_count INT;
BEGIN
    -- 1. DELETE RENAN PIANUCCI
    -- We search by email to be sure.
    SELECT id INTO v_renan_id FROM public.users WHERE email ILIKE '%renanpianucci%';
    
    IF v_renan_id IS NOT NULL THEN
        RAISE NOTICE 'Found Renan Pianucci (ID: %). Deleting...', v_renan_id;
        
        -- Delete from public.users (Auth users usually remain unless using supabase admin api, but this kills app access)
        DELETE FROM public.users WHERE id = v_renan_id;
        
        RAISE NOTICE 'Renan Pianucci deleted from public.users.';
    ELSE
        RAISE NOTICE 'Renan Pianucci not found in public.users.';
    END IF;

END $$;

-- 2. LIST OTHER SUSPICIOUS USERS IN MKTNOW SEDE
-- Logic: Users in Mktnow Sede (fec68b...) who do NOT have "mktnow" in their email.
-- This helps identifying other intruders.
SELECT 
    id, 
    email, 
    full_name, 
    created_at 
FROM public.users 
WHERE organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342' -- Mktnow Sede
AND email NOT ILIKE '%mktnow%' -- Adjust this domain if necessary
ORDER BY full_name;
