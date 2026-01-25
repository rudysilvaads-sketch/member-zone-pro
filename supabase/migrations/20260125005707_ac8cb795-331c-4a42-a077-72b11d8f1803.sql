-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- Allow public uploads to product-images bucket (auth is handled by Firebase)
CREATE POLICY "Anyone can upload product images" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'product-images');

-- Also update UPDATE and DELETE for consistency
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

CREATE POLICY "Anyone can update product images" 
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images" 
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'product-images');