-- Create saved_paths table
CREATE TABLE public.saved_paths (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  path_name TEXT NOT NULL,
  path_details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_paths ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read saved paths (no auth)
CREATE POLICY "Anyone can read saved paths"
ON public.saved_paths
FOR SELECT
USING (true);

-- Allow anyone to insert saved paths (no auth)
CREATE POLICY "Anyone can insert saved paths"
ON public.saved_paths
FOR INSERT
WITH CHECK (true);

-- Allow anyone to delete saved paths (no auth)
CREATE POLICY "Anyone can delete saved paths"
ON public.saved_paths
FOR DELETE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_saved_paths_created_at ON public.saved_paths(created_at DESC);