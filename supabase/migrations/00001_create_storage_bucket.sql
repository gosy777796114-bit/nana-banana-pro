
-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-media',
  'generated-media',
  true,
  null,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for generated-media bucket
CREATE POLICY "Allow public read on generated-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-media');

CREATE POLICY "Allow anon upload to generated-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-media');
