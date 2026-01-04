-- Fix 1: Drop insecure RLS policies on saved_paths
DROP POLICY IF EXISTS "Anyone can read saved paths" ON public.saved_paths;
DROP POLICY IF EXISTS "Anyone can insert saved paths" ON public.saved_paths;
DROP POLICY IF EXISTS "Anyone can delete saved paths" ON public.saved_paths;

-- Make user_id NOT NULL (required for secure RLS)
ALTER TABLE public.saved_paths ALTER COLUMN user_id SET NOT NULL;

-- Create secure owner-scoped RLS policies for saved_paths
CREATE POLICY "Users can read own paths"
ON public.saved_paths
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paths"
ON public.saved_paths
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paths"
ON public.saved_paths
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own paths"
ON public.saved_paths
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix 2: Drop insecure storage policies on resumes bucket
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete resumes" ON storage.objects;

-- Create secure user-scoped storage policies for resumes bucket
CREATE POLICY "Users can upload own resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);