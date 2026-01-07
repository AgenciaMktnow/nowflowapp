-- =========================================================================================
-- SHIELD PROTOCOL FINAL: SECURITY, ISOLATION & WHITELIST (IDEMPOTENT FIX)
-- =========================================================================================

BEGIN;

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create Invitations Table (Whitelist)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    role TEXT DEFAULT 'operational',
    token UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 3. Migration & Default Org Logic
DO $$
DECLARE
    default_org_id UUID;
    master_email TEXT := 'neto@mktnow.com.br';
    master_invite_id UUID;
BEGIN
    -- A. Ensure Default Organization
    SELECT id INTO default_org_id FROM public.organizations WHERE name = 'MKTNOW - Sede';
    IF default_org_id IS NULL THEN
        INSERT INTO public.organizations (name) VALUES ('MKTNOW - Sede') RETURNING id INTO default_org_id;
        RAISE NOTICE 'Created Master Organization: %', default_org_id;
    END IF;

    -- B. Add organization_id to Users and Migrate (Safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE public.users ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        
        -- Default migration for existing users
        UPDATE public.users SET organization_id = default_org_id WHERE organization_id IS NULL;
        
        -- FORCE ADMIN for Master User
        UPDATE public.users SET role = 'ADMIN' WHERE email = master_email;
        
        ALTER TABLE public.users ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- C. Migration for Data Tables (Tasks, Projects...)
    -- TASKS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'organization_id') THEN
        ALTER TABLE public.tasks ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.tasks SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.tasks ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    -- CLIENTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'organization_id') THEN
        ALTER TABLE public.clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.clients SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    -- PROJECTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'organization_id') THEN
        ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.projects SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.projects ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    -- BOARDS
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boards' AND column_name = 'organization_id') THEN
        ALTER TABLE public.boards ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.boards SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.boards ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    -- TEAMS
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'organization_id') THEN
        ALTER TABLE public.teams ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.teams SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.teams ALTER COLUMN organization_id SET NOT NULL;
    END IF;
     -- TIME_LOGS
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_logs' AND column_name = 'organization_id') THEN
        ALTER TABLE public.time_logs ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.time_logs SET organization_id = default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.time_logs ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- D. Auto-Invite Master User
    -- Ensure master exists in invitations
    INSERT INTO public.invitations (email, organization_id, role, accepted_at)
    VALUES (master_email, default_org_id, 'ADMIN', now()) 
    ON CONFLICT (email) DO NOTHING;
    
END $$;

-- 4. Secure Helper for RLS
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies (Apply Strict Isolation)
-- Add DROP POLICY IF EXISTS for every policy to ensure idempotency

-- USERS
DROP POLICY IF EXISTS "authenticated_users_select_all" ON public.users;
DROP POLICY IF EXISTS "org_isolation_select_users" ON public.users;
CREATE POLICY "org_isolation_select_users" ON public.users FOR SELECT USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
CREATE POLICY "users_update_own_profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND organization_id = get_auth_org_id());

-- TASKS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_select_tasks" ON public.tasks;
CREATE POLICY "org_isolation_select_tasks" ON public.tasks FOR SELECT USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_insert_tasks" ON public.tasks;
CREATE POLICY "org_isolation_insert_tasks" ON public.tasks FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_update_tasks" ON public.tasks;
CREATE POLICY "org_isolation_update_tasks" ON public.tasks FOR UPDATE USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_delete_tasks" ON public.tasks;
CREATE POLICY "org_isolation_delete_tasks" ON public.tasks FOR DELETE USING (organization_id = get_auth_org_id());

-- PROJECTS
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_select_projects" ON public.projects;
CREATE POLICY "org_isolation_select_projects" ON public.projects FOR SELECT USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_insert_projects" ON public.projects;
CREATE POLICY "org_isolation_insert_projects" ON public.projects FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_update_projects" ON public.projects;
CREATE POLICY "org_isolation_update_projects" ON public.projects FOR UPDATE USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_delete_projects" ON public.projects;
CREATE POLICY "org_isolation_delete_projects" ON public.projects FOR DELETE USING (organization_id = get_auth_org_id());

-- CLIENTS
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_select_clients" ON public.clients;
CREATE POLICY "org_isolation_select_clients" ON public.clients FOR SELECT USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_insert_clients" ON public.clients;
CREATE POLICY "org_isolation_insert_clients" ON public.clients FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_update_clients" ON public.clients;
CREATE POLICY "org_isolation_update_clients" ON public.clients FOR UPDATE USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_delete_clients" ON public.clients;
CREATE POLICY "org_isolation_delete_clients" ON public.clients FOR DELETE USING (organization_id = get_auth_org_id());

-- BOARDS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.boards;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.boards;

DROP POLICY IF EXISTS "org_isolation_select_boards" ON public.boards;
CREATE POLICY "org_isolation_select_boards" ON public.boards FOR SELECT USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_insert_boards" ON public.boards;
CREATE POLICY "org_isolation_insert_boards" ON public.boards FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_update_boards" ON public.boards;
CREATE POLICY "org_isolation_update_boards" ON public.boards FOR UPDATE USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_delete_boards" ON public.boards;
CREATE POLICY "org_isolation_delete_boards" ON public.boards FOR DELETE USING (organization_id = get_auth_org_id());


-- 6. UPDATE handle_new_user TO CONSUME INVITES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
    final_role TEXT;
    final_org_id UUID;
BEGIN
    -- Check for valid invite
    SELECT * INTO invite_record FROM public.invitations WHERE email = NEW.email;

    IF invite_record IS NULL THEN
         RAISE EXCEPTION 'User has no invitation.';
    END IF;

    final_role := invite_record.role;
    final_org_id := invite_record.organization_id;

    -- Insert into public.users
    INSERT INTO public.users (id, email, full_name, avatar_url, role, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        final_role,
        final_org_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = excluded.email,
        role = excluded.role,
        organization_id = excluded.organization_id;

    -- Mark invite as accepted
    UPDATE public.invitations SET accepted_at = now() WHERE id = invite_record.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. WHITELIST TRIGGER (Prevent Sign-up)
CREATE OR REPLACE FUNCTION public.check_whitelist_before_signup()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.invitations WHERE email = NEW.email) THEN
        RAISE EXCEPTION 'Cadastro restrito a convidados.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers
DROP TRIGGER IF EXISTS tr_check_whitelist ON auth.users;
CREATE TRIGGER tr_check_whitelist
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.check_whitelist_before_signup();

COMMIT;
