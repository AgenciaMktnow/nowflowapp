-- Create task_boards junction table
create table if not exists public.task_boards (
    task_id uuid references public.tasks(id) on delete cascade not null,
    board_id uuid references public.boards(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (task_id, board_id)
);

-- RLS Policies
alter table public.task_boards enable row level security;

create policy "Users can view task_boards they have access to via task"
    on public.task_boards for select
    using ( exists (
        select 1 from public.tasks t
        where t.id = task_boards.task_id
    ));

create policy "Users can insert task_boards"
    on public.task_boards for insert
    with check (true); -- Application logic handles permission via task creation

create policy "Users can delete task_boards"
    on public.task_boards for delete
    using (true); -- Application logic handles permission

-- Backfill Script: Populate task_boards from existing project.board_id
do $$
begin
    insert into public.task_boards (task_id, board_id)
    select t.id, p.board_id
    from public.tasks t
    join public.projects p on t.project_id = p.id
    where p.board_id is not null
    on conflict (task_id, board_id) do nothing;
end $$;
