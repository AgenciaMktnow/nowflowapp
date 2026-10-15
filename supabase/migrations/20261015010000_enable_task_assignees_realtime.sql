do $$
begin
    if to_regclass('public.task_assignees') is not null
       and not exists (
           select 1
           from pg_publication_tables
           where pubname = 'supabase_realtime'
             and schemaname = 'public'
             and tablename = 'task_assignees'
       ) then
        alter publication supabase_realtime add table public.task_assignees;
    end if;
end
$$;
