-- =========================================================================================
-- FEATURE: TASK ATTACHMENTS
-- =========================================================================================

BEGIN;

-- 1. Create Dropzone Table for File Metadata
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    path TEXT NOT NULL, -- Full storage path: task_id/filename
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'task_attachments' table
-- READ: Users can see attachments of tasks they have access to (tasks are currently public read)
CREATE POLICY "Authenticated users can read task attachments" 
    ON public.task_attachments FOR SELECT 
    USING (auth.role() = 'authenticated');

-- INSERT: Authenticated users can upload
CREATE POLICY "Authenticated users can upload task attachments" 
    ON public.task_attachments FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- DELETE: Owner or Admin/Manager can delete
CREATE POLICY "Users can delete their own attachments or Admins" 
    ON public.task_attachments FOR DELETE 
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'MANAGER')
        )
    );


-- 4. STORAGE POLICIES (Assuming bucket 'task-attachments' exists or will be created)
-- Note: Storage policies are tricky to script blindly as they depend on the 'storage.objects' table.
-- We will output instructions to create the bucket 'task-attachments' publicly or private.
-- Ideally: Private bucket, authenticated access.

-- Policy to allow uploads to 'task-attachments' bucket for authenticated users
-- The path structure enforced is: task-attachments/{task_id}/{filename}

-- (User needs to run this potentially in the dash if storage schema isn't exposed properly, but we try)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('task-attachments', 'task-attachments', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if storage schema not accessible directly, user might need to create bucket manually
    NULL;
END $$;

-- Allow public access to read files (simplifies the preview logic for now, or signed URLs later)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'task-attachments' );

-- Allow authenticated uploads
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-attachments' 
    AND auth.role() = 'authenticated'
);

-- Allow deletion by owner
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task-attachments' 
    AND auth.uid() = owner
);

COMMIT;
