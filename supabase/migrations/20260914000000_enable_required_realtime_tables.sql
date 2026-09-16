do $$
declare
    table_name text;
begin
    foreach table_name in array array[
        'task_boards',
        'task_comments',
        'task_attachments',
        'task_activities',
        'notifications',
        'time_logs',
        'system_announcements'
    ]
    loop
        if to_regclass('public.' || table_name) is not null
           and not exists (
               select 1
               from pg_publication_tables
               where pubname = 'supabase_realtime'
                 and schemaname = 'public'
                 and tablename = table_name
           ) then
            execute format('alter publication supabase_realtime add table public.%I', table_name);
        end if;
    end loop;
end
$$;
