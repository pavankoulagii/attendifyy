-- Storage bucket for payment screenshots (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: each user only accesses their own folder
CREATE POLICY "own proofs read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own proofs insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own proofs delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add screenshot path column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_proof_path text;