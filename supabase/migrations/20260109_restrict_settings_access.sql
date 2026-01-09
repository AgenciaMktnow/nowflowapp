-- Migration: Restrict Settings and Assets access to ADMIN users only

-- 1. Update system_settings policies
-- First drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.system_settings;

-- Re-create Read Policy (Everyone needs to read settings)
CREATE POLICY "Allow read access to authenticated users"
ON public.system_settings FOR SELECT
TO authenticated
USING (true);

-- Create restricted Update Policy
CREATE POLICY "Allow update access to admins only"
ON public.system_settings FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- Create restricted Insert Policy
CREATE POLICY "Allow insert access to admins only"
ON public.system_settings FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- 2. Update Storage Policies for 'public-assets'
-- Drop existing write policies
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Create restricted Insert (Upload) Policy
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-assets' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- Create restricted Update Policy
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public-assets' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- Create restricted Delete Policy
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-assets' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);
