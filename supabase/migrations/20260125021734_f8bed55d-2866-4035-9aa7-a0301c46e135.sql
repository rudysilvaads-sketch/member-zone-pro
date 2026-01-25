-- Drop existing policies that require Supabase auth
DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- Create new policy allowing public uploads (since auth is via Firebase)
CREATE POLICY "Allow public uploads to community-posts"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'community-posts');

-- Keep public read access
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-posts');

-- Allow public deletes for community-posts bucket
CREATE POLICY "Allow public deletes from community-posts"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'community-posts');