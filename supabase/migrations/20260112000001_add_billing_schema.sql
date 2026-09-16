-- =========================================================================================
-- SAAS BILLING SCHEMA
-- Adds subscription status, plan types, and resource limits to Organizations
-- =========================================================================================

BEGIN;

-- 1. Add Billing Columns to Organizations
-- Check and add 'subscription_status'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.organizations ADD COLUMN subscription_status TEXT DEFAULT 'trialing';
    END IF;
END $$;

-- Check and add 'plan_type'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'plan_type') THEN
        ALTER TABLE public.organizations ADD COLUMN plan_type TEXT DEFAULT 'PRO';
    END IF;
END $$;

-- Check and add 'stripe_customer_id'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.organizations ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- Check and add 'trial_ends_at'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE public.organizations ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');
    END IF;
END $$;

-- 2. Add Quota / Limits Columns
-- Check and add 'max_users'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'max_users') THEN
        ALTER TABLE public.organizations ADD COLUMN max_users INTEGER DEFAULT 5; -- Default limit for Trial/Pro starter
    END IF;
END $$;

-- Check and add 'max_boards'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'max_boards') THEN
        ALTER TABLE public.organizations ADD COLUMN max_boards INTEGER DEFAULT 3; -- Default limit for Trial/Pro starter
    END IF;
END $$;

-- 3. Configure MKTNOW - Sede (Legacy Support)
-- Ensure the main organization is immune to limits
UPDATE public.organizations
SET 
    plan_type = 'ENTERPRISE',
    subscription_status = 'active',
    max_users = 999999,
    max_boards = 999999,
    trial_ends_at = NULL
WHERE name = 'MKTNOW - Sede';

COMMIT;
