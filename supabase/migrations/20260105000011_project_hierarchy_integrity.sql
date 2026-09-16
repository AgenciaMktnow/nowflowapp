-- Ensure Project Hierarchy Integrity

-- 1. Ensure projects table has all necessary columns and FKs
DO $$
BEGIN
    -- client_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
        ALTER TABLE public.projects ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;

    -- board_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'board_id') THEN
        ALTER TABLE public.projects ADD COLUMN board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL;
    END IF;

    -- team_id (nucleo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'team_id') THEN
        ALTER TABLE public.projects ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Ensure RLS is enabled and policies allow access
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Clients Policies
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON public.clients;
CREATE POLICY "Allow authenticated users to read clients" ON public.clients FOR SELECT USING (true);

-- Boards Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.boards;
CREATE POLICY "Allow public read access" ON public.boards FOR SELECT USING (true);

-- Teams Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.teams;
CREATE POLICY "Allow public read access" ON public.teams FOR SELECT USING (true);

-- Projects Policies
DROP POLICY IF EXISTS "Allow authenticated users to manage projects" ON public.projects;
CREATE POLICY "Allow authenticated users to manage projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated');
