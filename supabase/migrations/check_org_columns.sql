-- CHECK SCHEMA FOR ORGANIZATION_ID
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('task_assignees', 'task_comments', 'task_attachments') 
AND column_name = 'organization_id';
