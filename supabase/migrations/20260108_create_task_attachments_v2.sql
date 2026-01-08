-- =========================================================================================
-- FEATURE: TASK ATTACHMENTS (FIXED V2)
-- =========================================================================================

BEGIN;

-- 1. Create Dropzone Table for File Metadata (IF NOT EXISTS protects this)
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

-- 2. Enable RLS (Safe to run multiple times)
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'task_attachments' table
DROP POLICY IF EXISTS "Authenticated users can read task attachments" ON public.task_attachments;
CREATE POLICY "Authenticated users can read task attachments" 
    ON public.task_attachments FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON public.task_attachments;
CREATE POLICY "Authenticated users can upload task attachments" 
    ON public.task_attachments FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own attachments or Admins" ON public.task_attachments;
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


-- 4. STORAGE POLICIES
-- We assume the bucket might already exist from previous attempts or manual creation.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('task-attachments', 'task-attachments', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Drop existing storage policies before recreating to avoid "policy already exists" error
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- Re-create Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'task-attachments' );

CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-attachments' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task-attachments' 
    AND auth.uid() = owner
);

COMMIT;
