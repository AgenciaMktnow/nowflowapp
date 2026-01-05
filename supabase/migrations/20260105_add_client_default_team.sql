-- Add default_team_id to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS default_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
