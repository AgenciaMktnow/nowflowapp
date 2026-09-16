-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clients;

-- Create permissive read policy for authenticated users
CREATE POLICY "Allow read access for authenticated users"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

-- Ensure projects relationship is solid (though likely fine)
-- Add policy for projects if missing (safety net)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.projects;
CREATE POLICY "Allow read access for authenticated users"
ON public.projects
FOR SELECT
TO authenticated
USING (true);
