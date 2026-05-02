import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface ClassPeriod {
  id: string;
  user_id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  room: string | null;
  created_at: string;
}

export function useClassPeriods() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["periods", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ClassPeriod[]> => {
      const { data, error } = await supabase
        .from("class_periods")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export interface ExtractedSubject {
  name: string;
  faculty: string;
  periods: { day_of_week: number; start_time: string; end_time: string; room: string }[];
}

const COLORS = ["#7c3aed", "#3b82f6", "#06b6d4", "#10b981", "#eab308", "#f97316", "#ef4444", "#ec4899"];

export interface PeriodInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string | null;
}

export function useSavePeriods() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ subjectId, periods }: { subjectId: string; periods: PeriodInput[] }) => {
      if (!user) throw new Error("not authed");
      // Replace strategy: delete existing then insert
      const { error: dErr } = await supabase
        .from("class_periods")
        .delete()
        .eq("subject_id", subjectId);
      if (dErr) throw dErr;
      if (periods.length === 0) return;
      const rows = periods.map((p) => ({
        user_id: user.id,
        subject_id: subjectId,
        day_of_week: p.day_of_week,
        start_time: normalizeTime(p.start_time),
        end_time: normalizeTime(p.end_time),
        room: p.room || null,
      }));
      const { error } = await supabase.from("class_periods").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useImportTimetable() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ subjects, replace = false, validityDays = 7 }: { subjects: ExtractedSubject[]; replace?: boolean; validityDays?: number }) => {
      if (!user) throw new Error("not authed");

      // Stamp upload timestamp + AI-detected validity (in days) for auto-expiry
      await supabase
        .from("profiles")
        .update({
          timetable_uploaded_at: new Date().toISOString(),
          timetable_valid_days: Math.max(1, Math.min(730, Math.round(validityDays))),
        } as any)
        .eq("user_id", user.id);

      // Load existing subjects so we can MERGE by name (case-insensitive).
      // Replace mode = swap the schedule but KEEP attendance counters & logs.
      const { data: existing, error: exErr } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("user_id", user.id);
      if (exErr) throw exErr;

      const norm = (s: string) => s.trim().toLowerCase();
      const byName = new Map<string, string>();
      (existing ?? []).forEach((s: any) => byName.set(norm(s.name), s.id));

      const matchedIds = new Set<string>();

      for (let i = 0; i < subjects.length; i++) {
        const s = subjects[i];
        const days = Array.from(new Set(s.periods.map((p) => p.day_of_week)));
        const existingId = byName.get(norm(s.name));

        let subjectId: string;
        if (existingId) {
          // Merge: update schedule/faculty but keep classes_held & classes_attended
          subjectId = existingId;
          matchedIds.add(existingId);
          const { error: uErr } = await supabase
            .from("subjects")
            .update({
              faculty: s.faculty || null,
              weekly_schedule: days as any,
            })
            .eq("id", existingId);
          if (uErr) throw uErr;
        } else {
          const { data: subj, error: sErr } = await supabase
            .from("subjects")
            .insert({
              user_id: user.id,
              name: s.name,
              faculty: s.faculty || null,
              color: COLORS[i % COLORS.length],
              weekly_schedule: days as any,
            })
            .select("id")
            .single();
          if (sErr) throw sErr;
          subjectId = subj.id;
        }

        // Replace this subject's periods with the new schedule
        const { error: dPErr } = await supabase
          .from("class_periods")
          .delete()
          .eq("subject_id", subjectId);
        if (dPErr) throw dPErr;

        if (s.periods.length > 0) {
          const rows = s.periods.map((p) => ({
            user_id: user.id,
            subject_id: subjectId,
            day_of_week: p.day_of_week,
            start_time: normalizeTime(p.start_time),
            end_time: normalizeTime(p.end_time),
            room: p.room || null,
          }));
          const { error: pErr } = await supabase.from("class_periods").insert(rows);
          if (pErr) throw pErr;
        }
      }

      // In replace mode: drop old subjects that aren't in the new timetable.
      // Their attendance_logs will cascade-delete. Subjects that match by
      // name keep their counters & logs intact.
      if (replace) {
        const stale = (existing ?? [])
          .filter((s: any) => !matchedIds.has(s.id))
          .map((s: any) => s.id);
        if (stale.length > 0) {
          const { error: sdErr } = await supabase.from("subjects").delete().in("id", stale);
          if (sdErr) throw sdErr;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
    },
  });
}

// Default timetable TTL — 7 days. The actual TTL is computed dynamically from
// `profile.timetable_valid_days` (auto-detected by AI from the timetable image).
export const TIMETABLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ttlMsFromDays = (days?: number | null) =>
  Math.max(1, Math.min(730, Math.round(days ?? 7))) * 24 * 60 * 60 * 1000;

export function useClearTimetable() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not authed");
      // Keep subjects + attendance_logs intact so the next uploaded
      // timetable can continue counters by merging on subject name.
      // Only the active schedule (periods + upload stamp) is cleared.
      const { error: pErr } = await supabase.from("class_periods").delete().eq("user_id", user.id);
      if (pErr) throw pErr;
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ timetable_uploaded_at: null } as any)
        .eq("user_id", user.id);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

function normalizeTime(t: string): string {
  // Ensure HH:MM:SS
  if (/^\d{2}:\d{2}$/.test(t)) return t + ":00";
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  // try parse "9:00" etc.
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}:00`;
  return "00:00:00";
}

export function fmtTime(t: string): string {
  // "HH:MM:SS" -> "9:00 AM"
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}
