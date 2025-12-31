
-- Insert a mock task for verification with CORRECT column names and values
WITH new_task AS (
  INSERT INTO tasks (title, description, status, priority, estimated_time, category, project_id, assignee_id)
  SELECT 
    'Verificação de Rastreabilidade',
    'Tarefa de teste para validar badge de desvio crítico e heatmap.',
    'IN_PROGRESS',  -- Correct Enum Value
    'HIGH',         -- Correct Enum Value
    2.0,            -- 2 hours estimated
    'Desenvolvimento',
    (SELECT id FROM projects LIMIT 1), -- Pick first project
    (SELECT id FROM users LIMIT 1)     -- Pick first user
  RETURNING id
)
-- Insert Time Logs for this task
INSERT INTO time_logs (task_id, user_id, start_time, end_time, duration_seconds, is_manual)
SELECT 
  id,
  (SELECT id FROM users LIMIT 1), -- Use same user
  NOW() - INTERVAL '4 hours', -- Started 4 hours ago
  NOW() - INTERVAL '2 hours', -- Ended 2 hours ago (2h duration)
  7200, -- 2 hours in seconds
  FALSE -- TYPE: TIMER
FROM new_task

UNION ALL

SELECT 
  id,
  (SELECT id FROM users LIMIT 1),
  NOW() - INTERVAL '1 hour',
  NOW(),
  3600, -- 1 hour in seconds
  TRUE -- TYPE: MANUAL
FROM new_task;
