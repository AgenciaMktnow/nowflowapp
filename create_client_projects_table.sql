-- Create a junction table to handle Many-to-Many relationship between Clients and Projects
create table if not exists public.client_projects (
  client_id uuid references public.clients(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (client_id, project_id)
);

-- Enable RLS (Optional, based on your existing policies)
alter table public.client_projects enable row level security;

-- Create policy for authenticated users to read/write (Adjust as needed)
create policy "Enable all access for authenticated users" on public.client_projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- (Optional) If you want to migrate existing data from the temporary 'client_id' column in projects:
-- insert into public.client_projects (client_id, project_id)
-- select client_id, id from public.projects where client_id is not null;

-- (Optional) Remove the temporary 'client_id' column from projects if you want to clean up:
-- alter table public.projects drop column client_id;
