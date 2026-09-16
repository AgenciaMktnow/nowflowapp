begin;

drop policy if exists "Task attachments public read" on storage.objects;
create policy "Task attachments public read"
on storage.objects
for select
to public
using (bucket_id = 'task-attachments');

drop policy if exists "Task attachments authenticated upload" on storage.objects;
create policy "Task attachments authenticated upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'task-attachments');

drop policy if exists "Task attachments owner update" on storage.objects;
create policy "Task attachments owner update"
on storage.objects
for update
to authenticated
using (bucket_id = 'task-attachments' and owner = auth.uid())
with check (bucket_id = 'task-attachments' and owner = auth.uid());

drop policy if exists "Task attachments owner delete" on storage.objects;
create policy "Task attachments owner delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'task-attachments' and owner = auth.uid());

create or replace function public.reorder_my_queue(p_task_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_task_id uuid;
    v_position integer;
begin
    if v_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    if coalesce(cardinality(p_task_ids), 0) = 0 then
        return;
    end if;

    if cardinality(p_task_ids) > 500 then
        raise exception 'Queue contains too many tasks' using errcode = '22023';
    end if;

    if cardinality(p_task_ids) <> (
        select count(distinct task_id)
        from unnest(p_task_ids) as task_ids(task_id)
    ) then
        raise exception 'Queue contains duplicate tasks' using errcode = '22023';
    end if;

    for v_task_id, v_position in
        select task_id, (ordinality - 1)::integer
        from unnest(p_task_ids) with ordinality as ordered_tasks(task_id, ordinality)
    loop
        update public.task_assignees
        set queue_position = v_position
        where task_id = v_task_id
          and user_id = v_user_id;

        if found then
            continue;
        end if;

        if exists (
            select 1
            from public.tasks
            where id = v_task_id
              and assignee_id = v_user_id
        ) then
            insert into public.task_assignees (task_id, user_id, queue_position)
            values (v_task_id, v_user_id, v_position)
            on conflict (task_id, user_id)
            do update set queue_position = excluded.queue_position;
            continue;
        end if;

        update public.tasks
        set queue_position = v_position
        where id = v_task_id
          and created_by = v_user_id;

        if not found then
            raise exception 'Task % is not available in this user queue', v_task_id
                using errcode = '42501';
        end if;
    end loop;
end;
$$;

revoke all on function public.reorder_my_queue(uuid[]) from public;
grant execute on function public.reorder_my_queue(uuid[]) to authenticated;

commit;
