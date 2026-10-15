begin;

insert into public.task_assignees (task_id, user_id)
select task.id, task.assignee_id
from public.tasks task
where task.assignee_id is not null
  and task.status <> 'DONE'
  and not exists (
      select 1 from public.task_assignees assignment
      where assignment.task_id = task.id and assignment.user_id = task.assignee_id
  )
on conflict (task_id, user_id) do nothing;

with ranked_assignments as (
    select assignment.task_id, assignment.user_id,
        row_number() over (
            partition by assignment.user_id
            order by assignment.queue_position nulls last,
                task.position nulls last, task.task_number, assignment.task_id
        ) - 1 as queue_position
    from public.task_assignees assignment
    join public.tasks task on task.id = assignment.task_id
    where task.status <> 'DONE' and assignment.completed_at is null
)
update public.task_assignees assignment
set queue_position = ranked.queue_position
from ranked_assignments ranked
where assignment.task_id = ranked.task_id and assignment.user_id = ranked.user_id;

create or replace function public.reorder_workload_queue_v2(
    p_assignee_id uuid,
    p_source_assignee_id uuid,
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
    v_primary_assignee_id uuid;
    v_task_id uuid;
    v_position integer;
begin
    if v_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    select organization_id, role into v_organization_id, v_role
    from public.users where id = v_user_id;

    if v_organization_id is null or v_role not in ('ADMIN', 'MANAGER') then
        raise exception 'Manager access required' using errcode = '42501';
    end if;

    if coalesce(cardinality(p_task_ids), 0) = 0 or not (p_moved_task_id = any(p_task_ids)) then
        raise exception 'Invalid destination queue' using errcode = '22023';
    end if;

    if cardinality(p_task_ids) > 500 then
        raise exception 'Queue contains too many tasks' using errcode = '22023';
    end if;

    if cardinality(p_task_ids) <> (
        select count(distinct task_id) from unnest(p_task_ids) as task_ids(task_id)
    ) then
        raise exception 'Queue contains duplicate tasks' using errcode = '22023';
    end if;

    if p_assignee_id is not null and not exists (
        select 1 from public.users
        where id = p_assignee_id and organization_id = v_organization_id
    ) then
        raise exception 'Destination user is outside this organization' using errcode = '42501';
    end if;

    select assignee_id into v_primary_assignee_id
    from public.tasks
    where id = p_moved_task_id and organization_id = v_organization_id;

    if not found then
        raise exception 'Moved task is outside this organization' using errcode = '42501';
    end if;

    if p_source_assignee_id is distinct from p_assignee_id then
        if p_source_assignee_id is not null then
            delete from public.task_assignees
            where task_id = p_moved_task_id and user_id = p_source_assignee_id;

            if not found then
                raise exception 'Task is not assigned to the source user' using errcode = '42501';
            end if;
        elsif v_primary_assignee_id is not null or exists (
            select 1 from public.task_assignees
            where task_id = p_moved_task_id and completed_at is null
        ) then
            raise exception 'Task is not unassigned' using errcode = '42501';
        end if;

        if p_assignee_id is not null then
            insert into public.task_assignees (task_id, user_id, completed_at)
            values (p_moved_task_id, p_assignee_id, null)
            on conflict (task_id, user_id) do update set completed_at = null;
        end if;

        if v_primary_assignee_id is not distinct from p_source_assignee_id or p_source_assignee_id is null then
            update public.tasks set assignee_id = p_assignee_id
            where id = p_moved_task_id and organization_id = v_organization_id;
        end if;
    end if;

    for v_task_id, v_position in
        select task_id, (ordinality - 1)::integer
        from unnest(p_task_ids) with ordinality as ordered_tasks(task_id, ordinality)
    loop
        if not exists (
            select 1 from public.tasks
            where id = v_task_id and organization_id = v_organization_id
        ) then
            raise exception 'Task % is outside this organization', v_task_id using errcode = '42501';
        end if;

        if p_assignee_id is null then
            update public.tasks task set queue_position = v_position
            where task.id = v_task_id and task.assignee_id is null
              and not exists (
                  select 1 from public.task_assignees assignment
                  where assignment.task_id = v_task_id and assignment.completed_at is null
              );

            if not found then
                raise exception 'Task % does not belong to the unassigned queue', v_task_id using errcode = '42501';
            end if;
        else
            update public.task_assignees assignment set queue_position = v_position
            from public.tasks task
            where assignment.task_id = v_task_id
              and assignment.user_id = p_assignee_id
              and assignment.completed_at is null
              and task.id = assignment.task_id
              and task.organization_id = v_organization_id;

            if not found then
                raise exception 'Task % does not belong to the destination queue', v_task_id using errcode = '42501';
            end if;
        end if;
    end loop;
end;
$$;

revoke all on function public.reorder_workload_queue_v2(uuid, uuid, uuid[], uuid) from public;
grant execute on function public.reorder_workload_queue_v2(uuid, uuid, uuid[], uuid) to authenticated;

commit;
