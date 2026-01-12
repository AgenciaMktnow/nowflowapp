-- =========================================================================================
-- SAAS GROWTH METRICS (FIXED)
-- Table to store daily snapshots of key metrics for trend analysis.
-- =========================================================================================

BEGIN;

-- 0. Cleanup (Optional: Reset table if it was created incorrectly)
DROP TABLE IF EXISTS public.daily_growth_metrics CASCADE;

-- 1. Create the Metrics History Table
CREATE TABLE IF NOT EXISTS public.daily_growth_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Financials
    total_mrr NUMERIC(10, 2) DEFAULT 0.00,
    total_revenue NUMERIC(10, 2) DEFAULT 0.00,
    operational_cost NUMERIC(10, 2) DEFAULT 0.00,
    gross_margin_percentage NUMERIC(5, 2) DEFAULT 0.00,
    
    -- Users & Orgs
    total_users INT DEFAULT 0,
    active_users_30d INT DEFAULT 0,
    total_orgs INT DEFAULT 0,
    active_orgs INT DEFAULT 0,
    paying_orgs INT DEFAULT 0,
    
    -- Churn / Retention Indicators
    new_orgs_count INT DEFAULT 0, -- New signups today
    churned_orgs_count INT DEFAULT 0, -- Cancelled today (mockable)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(), -- Added requested column
    UNIQUE(snapshot_date) -- One snapshot per day
);

-- 2. RLS Policies
ALTER TABLE public.daily_growth_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins can view metrics" ON public.daily_growth_metrics
    FOR SELECT USING (public.is_super_admin());

-- 3. Function to Capture Daily Snapshot
-- This should be called by a CRON job (e.g., pg_cron) every midnight
CREATE OR REPLACE FUNCTION public.capture_daily_snapshot()
RETURNS VOID AS $$
DECLARE
    v_mrr NUMERIC := 0;
    v_cost NUMERIC := 0;
    v_users INT := 0;
    v_active_users INT := 0;
    v_orgs INT := 0;
    v_active_orgs INT := 0;
    v_paying_orgs INT := 0;
    v_new_orgs INT := 0;
BEGIN
    -- Calculate MRR (Active Orgs Only)
    SELECT COALESCE(SUM(
        CASE 
            WHEN plan_type = 'ENTERPRISE' THEN 299 
            WHEN plan_type = 'PRO' THEN 99 
            ELSE 0 
        END
    ), 0)
    INTO v_mrr
    FROM public.organizations
    WHERE subscription_status = 'active';

    -- Count Users
    SELECT count(*) INTO v_users FROM public.users;
    
    -- Count Active Users (30d)
    -- Joining with latest activity
    SELECT count(DISTINCT user_id) INTO v_active_users
    FROM public.task_activities
    WHERE created_at > (now() - interval '30 days');

    -- Count Orgs
    SELECT count(*) INTO v_orgs FROM public.organizations;
    
    -- Count Active/Paying Orgs
    SELECT count(*) INTO v_active_orgs FROM public.organizations WHERE subscription_status = 'active';
    SELECT count(*) INTO v_paying_orgs FROM public.organizations WHERE plan_type IN ('PRO', 'ENTERPRISE') AND subscription_status = 'active';
    
    -- New Orgs (Created Today)
    SELECT count(*) INTO v_new_orgs FROM public.organizations WHERE created_at::date = CURRENT_DATE;

    -- Operational Cost Estimation (Simplified)
    -- Storage + Users
    -- (We could fetch storage size here but let's approximate for speed or add complex logic later)
    v_cost := (v_users * 0.50) + 10.00; -- R$ 0.50/user + R$ 10 base

    -- Upsert Snapshot
    INSERT INTO public.daily_growth_metrics (
        snapshot_date,
        total_mrr, 
        operational_cost, 
        total_users, 
        active_users_30d, 
        total_orgs, 
        active_orgs, 
        paying_orgs,
        new_orgs_count
    )
    VALUES (
        CURRENT_DATE,
        v_mrr,
        v_cost,
        v_users,
        v_active_users,
        v_orgs,
        v_active_orgs,
        v_paying_orgs,
        v_new_orgs
    )
    ON CONFLICT (snapshot_date) 
    DO UPDATE SET 
        total_mrr = EXCLUDED.total_mrr,
        operational_cost = EXCLUDED.operational_cost,
        total_users = EXCLUDED.total_users,
        active_users_30d = EXCLUDED.active_users_30d,
        total_orgs = EXCLUDED.total_orgs,
        updated_at = NOW(); 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to Fetch Historical Data for Charts
CREATE OR REPLACE FUNCTION public.get_growth_trends(days_limit INT DEFAULT 30)
RETURNS TABLE (
    date DATE,
    mrr NUMERIC,
    users INT,
    active_users INT
) AS $$
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        snapshot_date,
        total_mrr,
        total_users,
        active_users_30d
    FROM public.daily_growth_metrics
    ORDER BY snapshot_date ASC
    LIMIT days_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Seed Mock Data (Optional: For Development Visualization)
-- Checks if table is empty and populates last 30 days with some random growth
DO $$
DECLARE
    i INT;
    mock_mrr NUMERIC;
    mock_users INT;
BEGIN
    -- Force clear to re-seed correctly with updated_at
    DELETE FROM public.daily_growth_metrics;

    FOR i IN 1..30 LOOP
        -- Growing Numbers
        mock_mrr := 1000 + (i * 50) + (random() * 100); 
        mock_users := 50 + (i * 2) + floor(random() * 5);
        
        INSERT INTO public.daily_growth_metrics (
            snapshot_date, total_mrr, total_users, active_users_30d, updated_at
        ) VALUES (
            CURRENT_DATE - (30 - i) * INTERVAL '1 day', -- Corrected date math
            mock_mrr,
            mock_users,
            (mock_users * 0.6)::INT, -- 60% active
            NOW()
        );
    END LOOP;
    
    -- Capture Today's Real Data
    PERFORM public.capture_daily_snapshot();
END $$;

COMMIT;
