-- Add favicon_url column to system_settings table
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS favicon_url text;

-- Comment on column
COMMENT ON COLUMN public.system_settings.favicon_url IS 'URL for the company favicon';
