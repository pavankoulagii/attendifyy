import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Status } from "@/lib/attendance";

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  faculty: string | null;
  color: string;
  classes_held: number;
  classes_attended: number;
  required_attendance: number;
  weekly_schedule: number[]; // 0=Sun..6=Sat
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  subject_id: string;
  status: Status;
  date: string;
  created_at: string;
}

export function useSubjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Subject[]> => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useAttendanceLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["logs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AttendanceLog[]> => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .order("date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useUpsertSubject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: Partial<Subject> & { name: string }) => {
      if (!user) throw new Error("not authed");
      const payload: any = { ...s, user_id: user.id };
      if (s.id) {
        const { error } = await supabase.from("subjects").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subjects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ subject, status }: { subject: Subject; status: Status }) => {
      if (!user) throw new Error("not authed");
      // log
      const { error: logErr } = await supabase.from("attendance_logs").insert({
        user_id: user.id,
        subject_id: subject.id,
        status,
      });
      if (logErr) throw logErr;
      // update counters (cancelled doesn't count toward held)
      const held = status === "cancelled" ? subject.classes_held : subject.classes_held + 1;
      const attended = status === "present" ? subject.classes_attended + 1 : subject.classes_attended;
      const { error } = await supabase
        .from("subjects")
        .update({ classes_held: held, classes_attended: attended })
        .eq("id", subject.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      if (!user) throw new Error("not authed");
      const { error } = await supabase.from("profiles").update(patch as any).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
