-- Create task-attachments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of attachments
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'task-attachments' );

-- Policy to allow authenticated users to upload attachments
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'task-attachments' AND auth.role() = 'authenticated' );

-- Policy to allow users to update their own attachments (optional)
DROP POLICY IF EXISTS "Users Update Own Attachments" ON storage.objects;
CREATE POLICY "Users Update Own Attachments"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'task-attachments' AND auth.uid() = owner );

-- Policy to allow users to delete their own attachments
DROP POLICY IF EXISTS "Users Delete Own Attachments" ON storage.objects;
CREATE POLICY "Users Delete Own Attachments"
ON storage.objects FOR DELETE
USING ( bucket_id = 'task-attachments' AND auth.uid() = owner );
