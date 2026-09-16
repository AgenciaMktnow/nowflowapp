\set ON_ERROR_STOP on

BEGIN;
SET LOCAL session_replication_role = replica;

CREATE TEMP TABLE recovery_hex (raw text) ON COMMIT DROP;
\copy recovery_hex FROM '/tmp/nowflow_recovery_payload.hex'

CREATE TEMP TABLE recovery_payload (doc jsonb) ON COMMIT DROP;
INSERT INTO recovery_payload
SELECT convert_from(decode(raw, 'hex'), 'UTF8')::jsonb
FROM recovery_hex;

CREATE TEMP TABLE recovery_tasks ON COMMIT DROP AS
SELECT * FROM jsonb_populate_recordset(NULL::public.tasks, (SELECT doc->'tasks' FROM recovery_payload));

CREATE TEMP TABLE recovery_task_assignees ON COMMIT DROP AS
SELECT * FROM jsonb_populate_recordset(NULL::public.task_assignees, (SELECT doc->'task_assignees' FROM recovery_payload));

CREATE TEMP TABLE recovery_task_boards ON COMMIT DROP AS
SELECT * FROM jsonb_populate_recordset(NULL::public.task_boards, (SELECT doc->'task_boards' FROM recovery_payload));

CREATE TEMP TABLE recovery_task_comments ON COMMIT DROP AS
SELECT * FROM jsonb_populate_recordset(NULL::public.task_comments, (SELECT doc->'task_comments' FROM recovery_payload));

CREATE TEMP TABLE recovery_task_activities ON COMMIT DROP AS
SELECT * FROM jsonb_populate_recordset(NULL::public.task_activities, (SELECT doc->'task_activities' FROM recovery_payload));

CREATE TEMP TABLE recovery_time_logs ON COMMIT DROP AS
SELECT * FROM jsonb_populate_recordset(NULL::public.time_logs, (SELECT doc->'time_logs' FROM recovery_payload));

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM recovery_tasks source_task
        JOIN public.tasks target_task
          ON target_task.task_number = source_task.task_number
         AND target_task.id <> source_task.id
        WHERE source_task.task_number IN (863, 864)
    ) THEN
        RAISE EXCEPTION 'Task number collision during recovery';
    END IF;
END
$$;

INSERT INTO public.tasks
SELECT * FROM recovery_tasks WHERE task_number IN (863, 864)
ON CONFLICT DO NOTHING;

UPDATE public.tasks target
SET status = source.status
FROM recovery_tasks source
WHERE target.id = source.id AND source.task_number = 72;

UPDATE public.tasks target
SET description = source.description,
    assignee_id = source.assignee_id,
    column_id = source.column_id
FROM recovery_tasks source
WHERE target.id = source.id AND source.task_number IN (749, 799, 858);

UPDATE public.tasks target
SET status = source.status,
    column_id = source.column_id,
    completed_at = source.completed_at
FROM recovery_tasks source
WHERE target.id = source.id AND source.task_number IN (807, 838, 840);

UPDATE public.tasks target
SET status = source.status,
    position = source.position,
    column_id = source.column_id
FROM recovery_tasks source
WHERE target.id = source.id AND source.task_number = 860;

DELETE FROM public.task_assignees relation
USING public.tasks task
WHERE relation.task_id = task.id
  AND task.task_number IN (749, 799, 858, 863, 864);

INSERT INTO public.task_assignees
SELECT * FROM recovery_task_assignees
ON CONFLICT DO NOTHING;

INSERT INTO public.task_boards
SELECT * FROM recovery_task_boards
ON CONFLICT DO NOTHING;

INSERT INTO public.task_comments
SELECT * FROM recovery_task_comments
ON CONFLICT DO NOTHING;

INSERT INTO public.task_activities
SELECT * FROM recovery_task_activities
ON CONFLICT DO NOTHING;

-- Task 797 was compensated manually in the target database.
INSERT INTO public.time_logs
SELECT source_log.*
FROM recovery_time_logs source_log
JOIN public.tasks task ON task.id = source_log.task_id
WHERE task.task_number = 72
ON CONFLICT DO NOTHING;

UPDATE public.tasks
SET description = replace(
    description,
    'https://mowxezzjmtjlzftpzdxf.supabase.co/storage/v1/object/public/',
    'https://api-nowflow.mktnow.com.br/storage/v1/object/public/'
)
WHERE task_number IN (749, 799, 858, 863, 864);

UPDATE public.tasks task
SET total_duration = (
    SELECT coalesce(sum(time_log.duration_seconds), 0)
    FROM public.time_logs time_log
    WHERE time_log.task_id = task.id
      AND time_log.end_time IS NOT NULL
)
WHERE task.task_number = 72;

SELECT setval(
    pg_get_serial_sequence('public.tasks', 'task_number'),
    (SELECT max(task_number) FROM public.tasks),
    true
);

COMMIT;

SELECT 'RECOVERY_OK' AS status,
       count(*) AS task_count,
       max(task_number) AS max_task_number
FROM public.tasks;
