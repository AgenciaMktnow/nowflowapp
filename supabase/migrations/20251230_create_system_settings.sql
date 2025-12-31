-- Create system_settings table
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  logo_dark_url text,
  logo_light_url text,
  business_hours_start time default '09:00',
  business_hours_end time default '18:00',
  work_days text[] default array['MON', 'TUE', 'WED', 'THU', 'FRI'],
  first_day_of_week text default 'MONDAY', -- 'SUNDAY' or 'MONDAY'
  timezone text default 'America/Sao_Paulo',
  focus_goal_hours numeric default 6.0,
  daily_journey_hours numeric default 8.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.system_settings enable row level security;

create policy "Allow read access to authenticated users"
  on public.system_settings for select
  to authenticated
  using (true);

create policy "Allow update access to authenticated users"
  on public.system_settings for update
  to authenticated
  using (true);

create policy "Allow insert access to authenticated users"
  on public.system_settings for insert
  to authenticated
  with check (true);

-- Ensure single row logic (optional, but good practice for singleton settings)
-- For now, the App should just grab the first row.
