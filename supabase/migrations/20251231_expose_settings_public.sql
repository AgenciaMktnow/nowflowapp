-- Allow public read access to system_settings
-- This is required so the Login page can display the company logo and name before authentication.

-- Drop existing read policy if it conflicts (optional, but 'to authenticated' is distinct from 'to anon')
-- We want to ADD policy for anon.

create policy "Allow public read access"
  on public.system_settings for select
  to anon
  using (true);
