/* 
  # Fix Task Boards Relationship
  1. Drops and Recreates task_boards table
  2. Sets up RLS policies
  3. Backfills data from Projects (CRITICAL)
*/

-- 1. Reset Table
drop table if exists public.task_boards cascade;

-- 2. Create Table
create table public.task_boards (
    task_id uuid not null,
    board_id uuid not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint task_boards_pkey primary key (task_id, board_id),
    constraint task_boards_task_id_fkey foreign key (task_id) references public.tasks(id) on delete cascade,
    constraint task_boards_board_id_fkey foreign key (board_id) references public.boards(id) on delete cascade
);

-- 3. Enable Security
alter table public.task_boards enable row level security;

create policy "Users can view task_boards"
    on public.task_boards for select
    using (true);

create policy "Users can insert task_boards"
    on public.task_boards for insert
    with check (true);

create policy "Users can delete task_boards"
    on public.task_boards for delete
    using (true);

-- 4. Backfill Data (Restore Kanban View)
insert into public.task_boards (task_id, board_id)
select t.id, p.board_id
from public.tasks t
join public.projects p on t.project_id = p.id
where p.board_id is not null
on conflict do nothing;

-- 5. Refresh Cache
notify pgrst, 'reload config';
