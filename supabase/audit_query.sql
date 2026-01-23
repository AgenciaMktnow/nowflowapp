-- =========================================================================================
-- CENSO COMPLETO DO SISTEMA (TODAS AS ORGANIZAÇÕES)
-- =========================================================================================

-- 1. RESUMO GERAL (TOTAL E NULOS)
SELECT 
    'TASKS' as table_name,
    count(*) as total_records,
    count(*) FILTER (WHERE organization_id IS NULL) as null_org_count
FROM tasks
UNION ALL
SELECT 
    'PROJECTS',
    count(*) as total_records,
    count(*) FILTER (WHERE organization_id IS NULL) as null_org_count
FROM projects
UNION ALL
SELECT 
    'CLIENTS',
    count(*) as total_records,
    count(*) FILTER (WHERE organization_id IS NULL) as null_org_count
FROM clients;

-- 2. DETALHAMENTO POR ORGANIZAÇÃO (TASKS)
SELECT 
    COALESCE(o.name, 'SEM ORGANIZAÇÃO (NULL)') as organization_name,
    t.organization_id,
    count(*) as task_count
FROM tasks t
LEFT JOIN organizations o ON t.organization_id = o.id
GROUP BY t.organization_id, o.name
ORDER BY task_count DESC;
