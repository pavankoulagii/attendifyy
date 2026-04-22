CREATE UNIQUE INDEX IF NOT EXISTS profiles_upi_txn_id_unique
ON public.profiles (upi_txn_id)
WHERE upi_txn_id IS NOT NULL;