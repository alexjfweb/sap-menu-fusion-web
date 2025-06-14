
-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Create policy to allow public access to view files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- Create policy to allow authenticated users to insert files
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- Create policy to allow authenticated users to update files
CREATE POLICY "Authenticated users can update files" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads');

-- Create policy to allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete files" ON storage.objects FOR DELETE USING (bucket_id = 'uploads');
