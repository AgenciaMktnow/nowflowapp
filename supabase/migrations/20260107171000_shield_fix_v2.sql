-- =========================================================================================
-- SHIELD FIX V2: USER TRIGGER & RLS STABILITY
-- =========================================================================================

BEGIN;

-- 1. FIX: Add Auto-Fill Trigger to public.users (Fixes 400 Error)
-- This ensures 'ensure_user_profile' works by auto-setting organization_id
DROP TRIGGER IF EXISTS tr_set_org_users ON public.users;
CREATE TRIGGER tr_set_org_users
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- 2. FIX: Secure Function to avoid search_path hijacking or loops
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
BEGIN
    -- Explicitly select from public.users to avoid ambiguity
    RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. FIX: Refine Users Policy to break potential Recursion/406
-- Explicitly allow users to see THEMSELVES without needing the Org lookup
-- This optimizes the 'get_auth_org_id' internal query validation
DROP POLICY IF EXISTS "users_view_self" ON public.users;
CREATE POLICY "users_view_self" ON public.users FOR SELECT USING (id = auth.uid());

-- Keep the Org Isolation for seeing OTHERS, but the above policy handles the 'self' case first
-- Ensure the Org Isolation policy is distinct
DROP POLICY IF EXISTS "org_isolation_select_users" ON public.users;
CREATE POLICY "org_isolation_select_users" ON public.users FOR SELECT USING (organization_id = get_auth_org_id());

-- 4. FIX: Grants (Ensure Authenticated users can actually access the new tables)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.organizations TO authenticated;
GRANT ALL ON TABLE public.invitations TO authenticated;

-- Grants for content tables (just in case)
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.projects TO authenticated;
GRANT ALL ON TABLE public.time_logs TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.teams TO authenticated;
GRANT ALL ON TABLE public.boards TO authenticated;

COMMIT;
