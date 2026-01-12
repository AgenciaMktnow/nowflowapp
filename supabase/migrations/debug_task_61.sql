-- Query para auditar os logs de tempo da Tarefa #61
-- Isso vai mostrar exatamente o que está somando as 240 horas

SELECT 
    t.task_number,
    tl.id as log_id,
    tl.is_manual,
    tl.entry_category,
    tl.start_time,
    tl.end_time,
    tl.duration_seconds,
    (tl.duration_seconds / 3600.0)::numeric(10,2) as duration_hours,
    tl.description,
    u.email as user_email
FROM time_logs tl
JOIN tasks t ON t.id = tl.task_id
LEFT JOIN users u ON u.id = tl.user_id
WHERE t.task_number = 61
ORDER BY tl.start_time DESC;
