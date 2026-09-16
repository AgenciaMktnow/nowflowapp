-- Add is_continuous column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_continuous BOOLEAN DEFAULT FALSE;

-- Migration: Set is_continuous = TRUE for existing tasks without due_date
-- As per user request: "assuma por padrão que são 'Contínuas' para limpar o visual"
UPDATE public.tasks 
SET is_continuous = TRUE 
WHERE due_date IS NULL;

-- Make sure to expose it in RLS if needed (usually automatic for columns)
