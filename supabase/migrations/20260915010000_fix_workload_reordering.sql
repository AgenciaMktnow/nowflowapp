begin;

create or replace function public.reorder_workload_queue(
    p_assignee_id uuid,
    p_task_ids uuid[],
    p_moved_task_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_organization_id uuid;
    v_role text;
    v_previous_assignee_id uuid;
    v_task_id uuid;
    v_position integer;
begin
    if v_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    select organization_id, role
    into v_organization_id, v_role
    from public.users
    where id = v_user_id;

    if v_organization_id is null or v_role not in ('ADMIN', 'MANAGER') then
        raise exception 'Manager access required' using errcode = '42501';
    end if;

    if coalesce(cardinality(p_task_ids), 0) = 0
       or not (p_moved_task_id = any(p_task_ids)) then
        raise exception 'Invalid destination queue' using errcode = '22023';
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

    if p_assignee_id is not null and not exists (
        select 1
        from public.users
        where id = p_assignee_id
          and organization_id = v_organization_id
    ) then
        raise exception 'Destination user is outside this organization' using errcode = '42501';
    end if;

    select assignee_id
    into v_previous_assignee_id
    from public.tasks
    where id = p_moved_task_id
      and organization_id = v_organization_id;

    if not found then
        raise exception 'Moved task is outside this organization' using errcode = '42501';
    end if;

    update public.tasks
    set assignee_id = p_assignee_id
    where id = p_moved_task_id
      and organization_id = v_organization_id;

    if v_previous_assignee_id is distinct from p_assignee_id then
        if v_previous_assignee_id is not null then
            delete from public.task_assignees
            where task_id = p_moved_task_id
              and user_id = v_previous_assignee_id;
        end if;

        if p_assignee_id is not null then
            insert into public.task_assignees (task_id, user_id)
            values (p_moved_task_id, p_assignee_id)
            on conflict (task_id, user_id) do nothing;
        end if;
    end if;

    for v_task_id, v_position in
        select task_id, (ordinality * 1000)::integer
        from unnest(p_task_ids) with ordinality as ordered_tasks(task_id, ordinality)
    loop
        update public.tasks
        set position = v_position
        where id = v_task_id
          and organization_id = v_organization_id
          and assignee_id is not distinct from p_assignee_id;

        if not found then
            raise exception 'Task % does not belong to the destination queue', v_task_id
                using errcode = '42501';
        end if;

        if p_assignee_id is not null then
            insert into public.task_assignees (task_id, user_id, queue_position)
            values (v_task_id, p_assignee_id, (v_position / 1000) - 1)
            on conflict (task_id, user_id)
            do update set queue_position = excluded.queue_position;
        end if;
    end loop;
end;
$$;

revoke all on function public.reorder_workload_queue(uuid, uuid[], uuid) from public;
grant execute on function public.reorder_workload_queue(uuid, uuid[], uuid) to authenticated;

commit;
