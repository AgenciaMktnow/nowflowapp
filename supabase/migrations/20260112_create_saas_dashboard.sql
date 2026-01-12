-- =========================================================================================
-- SUPER ADMIN DASHBOARD ("GOD MODE")
-- RPCs for getting global metrics and managing organizations
-- =========================================================================================

BEGIN;

-- 1. Helper to Check Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_super BOOLEAN;
    user_email TEXT;
BEGIN
    -- Check App Metadata (Recommended)
    is_super := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'is_super_admin')::boolean;
    
    -- Fallback: Hardcoded Master Email (Safety Net)
    user_email := (current_setting('request.jwt.claims', true)::jsonb ->> 'email');
    
    IF is_super IS TRUE OR user_email = 'neto@mktnow.com.br' OR user_email = 'duqueneto@gmail.com' OR user_email = 'duqueneto@gmail.com.br' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Main Metrics RPC
-- Returns table of all organizations with usage data
CREATE OR REPLACE FUNCTION public.get_saas_metrics()
RETURNS TABLE (
    org_id UUID,
    org_name TEXT,
    plan_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    owner_email TEXT,
    user_count BIGINT,
    board_count BIGINT,
    task_count BIGINT,
    tasks_last_7d BIGINT,
    storage_size_mb NUMERIC
) AS $$
BEGIN
    -- Security Check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: Super Admin Only';
    END IF;

    RETURN QUERY
    SELECT 
        o.id as org_id,
        o.name as org_name,
        o.plan_type,
        o.subscription_status as status,
        o.created_at,
        o.trial_ends_at,
        -- Get First Admin Email
        (
            SELECT u.email 
            FROM public.users u 
            WHERE u.organization_id = o.id AND u.role = 'ADMIN' 
            LIMIT 1
        ) as owner_email,
        -- Counts
        (SELECT count(*) FROM public.users u WHERE u.organization_id = o.id) as user_count,
        (SELECT count(*) FROM public.boards b WHERE b.organization_id = o.id) as board_count,
        (SELECT count(*) FROM public.tasks t WHERE t.organization_id = o.id) as task_count,
        -- Engagement (Tasks created in last 7 days)
        (
            SELECT count(*) 
            FROM public.tasks t 
            WHERE t.organization_id = o.id 
            AND t.created_at > (now() - interval '7 days')
        ) as tasks_last_7d,
        -- Storage Estimator (Mock or Real if bucket available)
        -- Complex query on storage.objects, calculating simplified for now
        0.0 as storage_size_mb
    FROM 
        public.organizations o
    ORDER BY 
        o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Management RPCs (Suspend/Update)
CREATE OR REPLACE FUNCTION public.admin_update_org_plan(target_org_id UUID, new_plan TEXT, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    UPDATE public.organizations
    SET 
        plan_type = new_plan,
        subscription_status = new_status,
        -- Update quotas based on plan (Simple Logic)
        max_users = CASE 
            WHEN new_plan = 'ENTERPRISE' THEN 999999 
            WHEN new_plan = 'PRO' THEN 10 
            ELSE 5 
        END,
        max_boards = CASE 
            WHEN new_plan = 'ENTERPRISE' THEN 999999 
            WHEN new_plan = 'PRO' THEN 20 
            ELSE 3 
        END
    WHERE id = target_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
