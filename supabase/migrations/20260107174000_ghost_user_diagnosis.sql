-- =========================================================================================
-- DIAGNOSTIC: GHOST USERS DETECTOR
-- =========================================================================================
-- Run this in the Supabase SQL Editor to see the list of orphaned users.

SELECT 
    u.full_name,
    u.email,
    u.role,
    COUNT(DISTINCT t.id) as "Tarefas Atribuídas",
    COUNT(DISTINCT tl.id) as "Logs de Tempo",
    u.id as user_id
FROM public.users u
LEFT JOIN public.tasks t ON t.assignee_id = u.id
LEFT JOIN public.time_logs tl ON tl.user_id = u.id
WHERE u.id NOT IN (SELECT id FROM auth.users)
GROUP BY u.id, u.email, u.full_name, u.role
ORDER BY "Tarefas Atribuídas" DESC;
