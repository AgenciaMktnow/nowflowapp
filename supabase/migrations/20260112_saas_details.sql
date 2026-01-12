-- =========================================================================================
-- SUPER ADMIN: ORGANIZATION DETAILS ("X-RAY")
-- RPC for deep-dive metrics per organization
-- =========================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_org_details(target_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_task_count BIGINT;
    v_comment_count BIGINT;
    v_activity_count BIGINT;
    v_storage_bytes BIGINT;
    v_users_active_30d BIGINT;
    v_recent_logs JSONB;
    v_db_rows BIGINT;
    v_cost_est NUMERIC;
BEGIN
    -- Security Check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- 1. Database Rows Consumption
    SELECT count(*) INTO v_task_count FROM public.tasks WHERE organization_id = target_org_id;
    
    -- Comments (Join tasks to filter by org)
    SELECT count(*) INTO v_comment_count 
    FROM public.task_comments c
    JOIN public.tasks t ON t.id = c.task_id
    WHERE t.organization_id = target_org_id;

    -- Activities
    SELECT count(*) INTO v_activity_count 
    FROM public.task_activities a
    JOIN public.tasks t ON t.id = a.task_id
    WHERE t.organization_id = target_org_id;

    v_db_rows := v_task_count + v_comment_count + v_activity_count;

    -- 2. Storage Consumption (Sum of attachments)
    -- Using task_attachments table which has 'size' column
    SELECT COALESCE(SUM(size), 0) INTO v_storage_bytes
    FROM public.task_attachments ta
    JOIN public.tasks t ON t.id = ta.task_id
    WHERE t.organization_id = target_org_id;

    -- 3. Active Users (Last 30d Activity)
    SELECT count(DISTINCT user_id) INTO v_users_active_30d
    FROM public.task_activities a
    JOIN public.tasks t ON t.id = a.task_id
    WHERE t.organization_id = target_org_id
    AND a.created_at > (now() - interval '30 days');

    -- 4. Recent Logs (Last 10)
    SELECT jsonb_agg(t) INTO v_recent_logs
    FROM (
        SELECT 
            a.action_type,
            a.created_at,
            u.email as user_email,
            tasks.title as task_title
        FROM public.task_activities a
        JOIN public.tasks ON tasks.id = a.task_id
        LEFT JOIN public.users u ON u.id = a.user_id
        WHERE tasks.organization_id = target_org_id
        ORDER BY a.created_at DESC
        LIMIT 10
    ) t;

    -- 5. Cost Estimation (Refined Logic)
    -- Storage: R$ 0.20 per GB (S3 Standard approx)
    -- Compute/DB: R$ 2.00 Base + R$ 0.50 per Active User
    v_cost_est := 2.00 + ((v_storage_bytes::numeric / 1024 / 1024 / 1024) * 0.20) + (v_users_active_30d * 0.50);

    -- 6. Plan Value Estimator
    DECLARE
        v_plan_type TEXT;
        v_plan_value NUMERIC;
    BEGIN
        SELECT plan_type INTO v_plan_type FROM public.organizations WHERE id = target_org_id;
        
        IF v_plan_type = 'ENTERPRISE' THEN v_plan_value := 997.00;
        ELSIF v_plan_type = 'PRO' THEN v_plan_value := 197.00;
        ELSE v_plan_value := 0.00; -- TRIAL / FREE
        END IF;

        RETURN jsonb_build_object(
            'db_rows', v_db_rows,
            'task_count', v_task_count,
            'comment_count', v_comment_count,
            'storage_mb', round((v_storage_bytes::numeric / 1024 / 1024), 2),
            'active_users_30d', v_users_active_30d,
            'estimated_cost', round(v_cost_est, 2),
            'plan_value', v_plan_value,
            'profit_margin', round(v_plan_value - v_cost_est, 2),
            'recent_logs', COALESCE(v_recent_logs, '[]'::jsonb)
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
