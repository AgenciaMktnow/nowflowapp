-- Add theme_preference column to system_settings table
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'DARK';

-- Comment on column
COMMENT ON COLUMN public.system_settings.theme_preference IS 'System theme preference: DARK (default) or LIGHT';
