begin;

create or replace function public.start_task_timer(
    p_task_id uuid,
    p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    v_new_log jsonb;
    v_now timestamptz := now();
    v_timezone text;
    v_day_start timestamptz;
    v_day_end timestamptz;
    v_today_seconds bigint;
    v_limit_seconds numeric;
begin
    if auth.uid() is not null and auth.uid() <> p_user_id then
        raise exception 'User cannot start a timer for another account.' using errcode = '42501';
    end if;

    select
        coalesce(nullif(timezone, ''), 'UTC'),
        daily_journey_hours * 3600
    into v_timezone, v_limit_seconds
    from public.system_settings
    limit 1;

    v_timezone := coalesce(v_timezone, 'UTC');
    v_day_start := date_trunc('day', v_now at time zone v_timezone) at time zone v_timezone;
    v_day_end := (
        date_trunc('day', v_now at time zone v_timezone) + interval '1 day'
    ) at time zone v_timezone;

    select coalesce(sum(duration_seconds), 0)
    into v_today_seconds
    from public.time_logs
    where user_id = p_user_id
      and start_time >= v_day_start
      and start_time < v_day_end
      and end_time is not null;

    if v_limit_seconds is not null and v_today_seconds >= v_limit_seconds then
        raise exception 'Limite diário de jornada atingido.';
    end if;

    update public.time_logs
    set end_time = v_now,
        duration_seconds = extract(epoch from (v_now - start_time))::integer
    where user_id = p_user_id
      and end_time is null;

    insert into public.time_logs (
        task_id,
        user_id,
        start_time,
        is_manual,
        entry_category
    )
    values (p_task_id, p_user_id, v_now, false, 'TIMER')
    returning to_jsonb(time_logs.*) into v_new_log;

    update public.tasks
    set status = 'IN_PROGRESS'
    where id = p_task_id
      and status <> 'IN_PROGRESS';

    return v_new_log;
end;
$$;

revoke all on function public.start_task_timer(uuid, uuid) from public;
grant execute on function public.start_task_timer(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
