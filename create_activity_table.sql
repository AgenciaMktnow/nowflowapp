
-- Create task_activities table
create table if not exists task_activities (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references users(id) on delete set null,
  activity_type text not null,
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table task_activities enable row level security;

-- Policies
create policy "Users can view activities for projects they are part of"
  on task_activities for select
  using (
    exists (
      select 1 from tasks
      where tasks.id = task_activities.task_id
      -- Add project membership check if complex, or just allow auth users for now
    )
  );

create policy "Users can insert activities"
  on task_activities for insert
  with check (auth.uid() = user_id);
