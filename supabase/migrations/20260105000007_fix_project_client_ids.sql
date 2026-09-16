-- Migration to fix inconsistent data: usage of client_id on projects
-- This script updates projects that have null client_id by looking at their associated tasks.
-- It assumes that if a project has tasks assigned to a specific client, the project usually belongs to that client.
-- This is a heuristic fix requested by the user.

UPDATE public.projects p
SET client_id = t.client_id
FROM public.tasks t
WHERE p.id = t.project_id
  AND p.client_id IS NULL
  AND t.client_id IS NOT NULL;
