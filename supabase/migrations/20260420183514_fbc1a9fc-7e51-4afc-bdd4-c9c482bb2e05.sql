-- Add time slot support: replace simple weekly_schedule day array with structured class periods
-- Keep weekly_schedule for backward compat (days only) and add class_periods for full time slots

CREATE TABLE IF NOT EXISTS public.class_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_periods_user_day ON public.class_periods(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_periods_subject ON public.class_periods(subject_id);

ALTER TABLE public.class_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own periods select" ON public.class_periods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own periods insert" ON public.class_periods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own periods update" ON public.class_periods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own periods delete" ON public.class_periods FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for timetable image uploads (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('timetables', 'timetables', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own timetable upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'timetables' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own timetable read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'timetables' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own timetable delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'timetables' AND auth.uid()::text = (storage.foldername(name))[1]);