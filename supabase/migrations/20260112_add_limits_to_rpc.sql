-- Update RPCs to return Limits for UI Progress Bars

BEGIN;

-- 1. Update get_saas_metrics (Dashboard)
-- MUST DROP first because return type (TABLE columns) changed
DROP FUNCTION IF EXISTS public.get_saas_metrics();

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
    storage_size_mb NUMERIC,
    max_users INT,
    max_boards INT,
    max_storage_mb NUMERIC
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
        -- Storage Estimator
        0.0 as storage_size_mb,
        
        -- LIMITS
        o.max_users,
        o.max_boards,
        CASE 
            WHEN o.plan_type = 'ENTERPRISE' THEN 1048576.0 -- 1TB
            WHEN o.plan_type = 'PRO' THEN 51200.0 -- 50GB
            ELSE 2048.0 -- 2GB (Free)
        END as max_storage_mb

    FROM 
        public.organizations o
    ORDER BY 
        o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update get_org_details (X-Ray)
CREATE OR REPLACE FUNCTION public.get_org_details(target_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    -- Metrics
    v_db_rows BIGINT := 0;
    v_storage_bytes BIGINT := 0;
    v_users_active_30d INT := 0;
    v_total_users INT := 0;
    v_board_count INT := 0;
    v_task_count INT := 0;
    v_comment_count INT := 0;
    v_activity_count INT := 0;
    v_recent_logs JSONB;
    
    -- Metadata
    v_owner_email TEXT;
    v_plan_type TEXT;
    v_status TEXT;
    v_created_at TIMESTAMPTZ;
    v_trial_ends_at TIMESTAMPTZ;
    v_max_users INT;
    v_max_boards INT;

    -- Financials
    v_cost_est NUMERIC := 0.0;
    v_plan_value NUMERIC := 0.0;
BEGIN
    -- Security Check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- 1. Get Basic Info & Metadata
    SELECT 
        o.plan_type, 
        o.subscription_status, 
        o.created_at,
        o.trial_ends_at,
        o.max_users,
        o.max_boards
    INTO 
        v_plan_type, 
        v_status, 
        v_created_at, 
        v_trial_ends_at,
        v_max_users,
        v_max_boards
    FROM public.organizations o
    WHERE o.id = target_org_id;

    -- 2. Get Owner (First Admin found)
    SELECT u.email INTO v_owner_email 
    FROM public.users u
    WHERE u.organization_id = target_org_id AND u.role = 'ADMIN' 
    LIMIT 1;

    -- 3. Get Counts (DB Rows estimation)
    SELECT count(*) INTO v_total_users FROM public.users u WHERE u.organization_id = target_org_id;
    SELECT count(*) INTO v_board_count FROM public.boards b WHERE b.organization_id = target_org_id;
    SELECT count(*) INTO v_task_count FROM public.tasks t WHERE t.organization_id = target_org_id;
    
    -- Comment count: safer join
    SELECT count(*) INTO v_comment_count 
    FROM public.task_comments c
    JOIN public.tasks t ON t.id = c.task_id
    WHERE t.organization_id = target_org_id;

    -- Activity count
    SELECT count(*) INTO v_activity_count 
    FROM public.task_activities a
    JOIN public.tasks t ON t.id = a.task_id
    WHERE t.organization_id = target_org_id;

    -- Aggregate DB Rows (Approx)
    v_db_rows := v_task_count + v_comment_count + v_activity_count + v_total_users + v_board_count;

    -- 4. Storage Usage (Sum of attachments size)
    -- Using task_attachments table (col: size)
    SELECT COALESCE(SUM(ta.size), 0) INTO v_storage_bytes
    FROM public.task_attachments ta
    JOIN public.tasks t ON t.id = ta.task_id
    WHERE t.organization_id = target_org_id;

    -- 5. Active Users (Last 30 days based on activity table)
    SELECT count(DISTINCT a.user_id) INTO v_users_active_30d
    FROM public.task_activities a
    JOIN public.tasks t ON t.id = a.task_id
    WHERE t.organization_id = target_org_id 
    AND a.created_at > (now() - interval '30 days');

    -- 6. Recent Logs (Last 50)
    SELECT jsonb_agg(log_entry) INTO v_recent_logs
    FROM (
        SELECT 
            a.action_type, 
            a.created_at, 
            u.email as user_email,
            t.title as task_title,
            a.details
        FROM public.task_activities a
        JOIN public.tasks t ON t.id = a.task_id
        LEFT JOIN public.users u ON u.id = a.user_id
        WHERE t.organization_id = target_org_id
        ORDER BY a.created_at DESC 
        LIMIT 50
    ) log_entry;

    -- 7. Cost Estimation
    -- Storage: R$ 0.20 per GB (S3 Standard approx) -> / 1073741824
    -- Compute/DB: R$ 2.00 Base + R$ 0.50 per Active User
    v_cost_est := 2.00 + ((v_storage_bytes::numeric / 1073741824.0) * 0.20) + (v_users_active_30d * 0.50);

    -- 8. Plan Value Logic
    IF v_plan_type = 'ENTERPRISE' THEN v_plan_value := 997.00;
    ELSIF v_plan_type = 'PRO' THEN v_plan_value := 197.00;
    ELSE v_plan_value := 0.00; 
    END IF;

    -- 9. Return JSONB
    RETURN jsonb_build_object(
        'org_id', target_org_id,
        'owner_email', v_owner_email,
        'plan_type', v_plan_type,
        'status', v_status,
        'created_at', v_created_at,
        'trial_ends_at', v_trial_ends_at,
        'total_users', v_total_users,
        'board_count', v_board_count,
        'task_count', v_task_count,
        'comment_count', v_comment_count,
        'db_rows', v_db_rows,
        'storage_mb', round((v_storage_bytes::numeric / 1024.0 / 1024.0), 2),
        'active_users_30d', v_users_active_30d,
        'estimated_cost', round(v_cost_est, 2),
        'plan_value', v_plan_value,
        'profit_margin', round(v_plan_value - v_cost_est, 2),
        'recent_logs', COALESCE(v_recent_logs, '[]'::jsonb),
        'max_users', v_max_users,
        'max_boards', v_max_boards,
        'max_storage_mb', CASE 
            WHEN v_plan_type = 'ENTERPRISE' THEN 1048576.0 
            WHEN v_plan_type = 'PRO' THEN 51200.0 
            ELSE 2048.0 
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
