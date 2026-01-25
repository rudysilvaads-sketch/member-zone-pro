-- Create storage bucket for chat audio messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-audio', 'chat-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read audio files (public bucket)
CREATE POLICY "Anyone can view chat audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-audio');

-- Allow authenticated users to upload audio
CREATE POLICY "Authenticated users can upload chat audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-audio');

-- Allow users to delete their own audio
CREATE POLICY "Users can delete their own chat audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-audio');