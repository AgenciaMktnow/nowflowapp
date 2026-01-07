-- =========================================================================================
-- SHIELD PROTOCOL PATCH: AUTO-FILL ORGANIZATION ID
-- =========================================================================================
-- Problem: Frontend inserts don't check/send organization_id, but the DB now requires it.
-- Solution: Trigger to automatically set organization_id from the user's profile BEFORE insert.

BEGIN;

-- 1. Helper Function to set Org ID
CREATE OR REPLACE FUNCTION public.set_current_org_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If organization_id is already set (e.g. by admin or future frontend), keep it.
    -- Otherwise, fetch from user profile.
    IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM public.users
        WHERE id = auth.uid();
        
        -- Safe check: If still null (shouldn't happen for valid users), raise error or let constraint fail
        IF NEW.organization_id IS NULL THEN
             RAISE EXCEPTION 'User not assigned to an organization.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply Triggers to All Content Tables

-- TASKS
DROP TRIGGER IF EXISTS tr_set_org_tasks ON public.tasks;
CREATE TRIGGER tr_set_org_tasks
    BEFORE INSERT ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- PROJECTS
DROP TRIGGER IF EXISTS tr_set_org_projects ON public.projects;
CREATE TRIGGER tr_set_org_projects
    BEFORE INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- TIME_LOGS
DROP TRIGGER IF EXISTS tr_set_org_time_logs ON public.time_logs;
CREATE TRIGGER tr_set_org_time_logs
    BEFORE INSERT ON public.time_logs
    FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- CLIENTS
DROP TRIGGER IF EXISTS tr_set_org_clients ON public.clients;
CREATE TRIGGER tr_set_org_clients
    BEFORE INSERT ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- TEAMS
DROP TRIGGER IF EXISTS tr_set_org_teams ON public.teams;
CREATE TRIGGER tr_set_org_teams
    BEFORE INSERT ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- BOARDS
DROP TRIGGER IF EXISTS tr_set_org_boards ON public.boards;
CREATE TRIGGER tr_set_org_boards
    BEFORE INSERT ON public.boards
    FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

COMMIT;
