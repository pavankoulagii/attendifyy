-- Restrict all RLS policies to authenticated role only (no anon access)
DROP POLICY IF EXISTS "own logs select" ON public.attendance_logs;
DROP POLICY IF EXISTS "own logs insert" ON public.attendance_logs;
DROP POLICY IF EXISTS "own logs update" ON public.attendance_logs;
DROP POLICY IF EXISTS "own logs delete" ON public.attendance_logs;
CREATE POLICY "own logs select" ON public.attendance_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own logs insert" ON public.attendance_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs update" ON public.attendance_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own logs delete" ON public.attendance_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own subjects select" ON public.subjects;
DROP POLICY IF EXISTS "own subjects insert" ON public.subjects;
DROP POLICY IF EXISTS "own subjects update" ON public.subjects;
DROP POLICY IF EXISTS "own subjects delete" ON public.subjects;
CREATE POLICY "own subjects select" ON public.subjects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subjects insert" ON public.subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subjects update" ON public.subjects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subjects delete" ON public.subjects FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own profile select" ON public.profiles;
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
DROP POLICY IF EXISTS "own profile delete" ON public.profiles;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own periods select" ON public.class_periods;
DROP POLICY IF EXISTS "own periods insert" ON public.class_periods;
DROP POLICY IF EXISTS "own periods update" ON public.class_periods;
DROP POLICY IF EXISTS "own periods delete" ON public.class_periods;
CREATE POLICY "own periods select" ON public.class_periods FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own periods insert" ON public.class_periods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own periods update" ON public.class_periods FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own periods delete" ON public.class_periods FOR DELETE TO authenticated USING (auth.uid() = user_id);