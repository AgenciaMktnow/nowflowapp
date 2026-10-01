begin;

create or replace function public.reorder_kanban_tasks(
    p_task_ids uuid[],
    p_moved_task_id uuid,
    p_status text,
    p_column_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    v_updated integer;
begin
    if auth.uid() is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;
    if coalesce(cardinality(p_task_ids), 0) = 0 or cardinality(p_task_ids) > 1000
       or cardinality(p_task_ids) <> (select count(distinct id) from unnest(p_task_ids) as input(id))
       or not p_moved_task_id = any(p_task_ids)
       or p_status is null
       or p_status not in ('BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'DONE', 'PAUSED') then
        raise exception 'Invalid Kanban order' using errcode = '22023';
    end if;

    update public.tasks as task
    set position = ordered.ordinality * 1000.0,
        status = case when task.id = p_moved_task_id then p_status else task.status end,
        column_id = case when task.id = p_moved_task_id then p_column_id else task.column_id end
    from unnest(p_task_ids) with ordinality as ordered(id, ordinality)
    where task.id = ordered.id;

    get diagnostics v_updated = row_count;
    if v_updated <> cardinality(p_task_ids) then
        raise exception 'Some tasks are not available for reordering' using errcode = '42501';
    end if;
end;
$$;

revoke all on function public.reorder_kanban_tasks(uuid[], uuid, text, uuid) from public;
grant execute on function public.reorder_kanban_tasks(uuid[], uuid, text, uuid) to authenticated;
notify pgrst, 'reload schema';

commit;
