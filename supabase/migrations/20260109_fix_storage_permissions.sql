-- Migration to fix and expand RLS policies for the public-assets storage bucket

-- Enable RLS on storage.objects (good practice to ensure, though usually enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate and avoid conflicts
-- We use a DO block to handle potential "policy does not exist" errors gracefully if needed, 
-- but DROP POLICY IF EXISTS is supported in modern Postgres.

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects; 
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 1. ALLOW PUBLIC SELECT (Viewing images)
-- Everyone (anon and authenticated) can view files in this bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'public-assets' );

-- 2. ALLOW AUTHENTICATED INSERT (Uploading new files)
-- Any logged-in user (authenticated role) can upload to this bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'public-assets' );

-- 3. ALLOW AUTHENTICATED UPDATE (Replacing files)
-- Any logged-in user can update files in this bucket
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'public-assets' );

-- 4. ALLOW AUTHENTICATED DELETE (Removing files)
-- Any logged-in user can delete files in this bucket (Essential for proper management)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'public-assets' );
