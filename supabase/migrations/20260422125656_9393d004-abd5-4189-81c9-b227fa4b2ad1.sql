ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS upi_txn_id text,
ADD COLUMN IF NOT EXISTS premium_plan text,
ADD COLUMN IF NOT EXISTS premium_paid_at timestamptz;