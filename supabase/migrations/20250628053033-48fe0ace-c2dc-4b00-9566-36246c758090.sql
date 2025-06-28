
-- Create the resumes storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false);

-- Create storage policies for the resumes bucket
CREATE POLICY "Users can upload resumes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Users can view resumes" ON storage.objects
  FOR SELECT USING (bucket_id = 'resumes');

CREATE POLICY "Users can delete resumes" ON storage.objects
  FOR DELETE USING (bucket_id = 'resumes');

-- Create the saved_paths table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_paths (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  path_name TEXT NOT NULL,
  path_details_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on saved_paths
ALTER TABLE public.saved_paths ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_paths (making them public for now since auth is disabled)
CREATE POLICY "Anyone can view saved paths" ON public.saved_paths
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert saved paths" ON public.saved_paths
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete saved paths" ON public.saved_paths
  FOR DELETE USING (true);
