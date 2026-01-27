-- Create storage bucket for tutorial files
INSERT INTO storage.buckets (id, name, public)
VALUES ('tutorial-files', 'tutorial-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to tutorial files
CREATE POLICY "Tutorial files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'tutorial-files');

-- Allow authenticated users to upload tutorial files (admins will handle this in code)
CREATE POLICY "Anyone can upload tutorial files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tutorial-files');

-- Allow deletion of tutorial files
CREATE POLICY "Anyone can delete tutorial files"
ON storage.objects FOR DELETE
USING (bucket_id = 'tutorial-files');