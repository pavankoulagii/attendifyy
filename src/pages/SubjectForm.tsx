import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSubjects, useUpsertSubject } from "@/lib/data";
import { useClassPeriods, useSavePeriods, fmtTime, type PeriodInput } from "@/lib/periods";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ["#7c3aed", "#3b82f6", "#06b6d4", "#10b981", "#eab308", "#f97316", "#ef4444", "#ec4899"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SubjectForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { data: subjects = [] } = useSubjects();
  const { data: allPeriods = [] } = useClassPeriods();
  const editing = id ? subjects.find((s) => s.id === id) : null;
  const upsert = useUpsertSubject();
  const savePeriods = useSavePeriods();

  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [held, setHeld] = useState(0);
  const [attended, setAttended] = useState(0);
  const [required, setRequired] = useState(75);
  const [color, setColor] = useState(COLORS[0]);
  const [periods, setPeriods] = useState<PeriodInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setFaculty(editing.faculty ?? "");
      setHeld(editing.classes_held);
      setAttended(editing.classes_attended);
      setRequired(Number(editing.required_attendance));
      setColor(editing.color);
      const existing = allPeriods
        .filter((p) => p.subject_id === editing.id)
        .map((p) => ({
          day_of_week: p.day_of_week,
          start_time: p.start_time.slice(0, 5),
          end_time: p.end_time.slice(0, 5),
          room: p.room ?? "",
        }));
      setPeriods(existing);
    }
  }, [editing, allPeriods]);

  const addPeriod = () =>
    setPeriods((prev) => [...prev, { day_of_week: 1, start_time: "09:00", end_time: "10:00", room: "" }]);

  const updatePeriod = (i: number, patch: Partial<PeriodInput>) =>
    setPeriods((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const removePeriod = (i: number) => setPeriods((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Subject name is required");
    if (attended > held) return toast.error("Attended can't exceed held");
    for (const p of periods) {
      if (p.start_time >= p.end_time) return toast.error("Start time must be before end time");
    }

    setSubmitting(true);
    try {
      const days = Array.from(new Set(periods.map((p) => p.day_of_week)));
      // Insert/update subject and get id
      let subjectId = editing?.id;
      if (subjectId) {
        const { error } = await supabase
          .from("subjects")
          .update({
            name: name.trim(),
            faculty: faculty.trim() || null,
            classes_held: held,
            classes_attended: attended,
            required_attendance: required,
            color,
            weekly_schedule: days as any,
          })
          .eq("id", subjectId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            user_id: user!.id,
            name: name.trim(),
            faculty: faculty.trim() || null,
            classes_held: held,
            classes_attended: attended,
            required_attendance: required,
            color,
            weekly_schedule: days as any,
          })
          .select("id")
          .single();
        if (error) throw error;
        subjectId = data.id;
      }

      await savePeriods.mutateAsync({ subjectId: subjectId!, periods });
      toast.success(editing ? "Updated" : "Subject added 🎉");
      nav("/app/subjects");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 pt-8 pb-32 space-y-5 animate-fade-in">
      <header className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="h-10 w-10 rounded-2xl glass grid place-items-center tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">{editing ? "Edit subject" : "New subject"}</h1>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <GlassCard className="space-y-4">
          <Field label="Subject name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Physics" className="h-12 rounded-xl" />
          </Field>
          <Field label="Faculty (optional)">
            <Input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="Dr. Sharma" className="h-12 rounded-xl" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Classes held">
              <Input type="number" min={0} value={held} onChange={(e) => setHeld(+e.target.value)} className="h-12 rounded-xl" />
            </Field>
            <Field label="Attended">
              <Input type="number" min={0} value={attended} onChange={(e) => setAttended(+e.target.value)} className="h-12 rounded-xl" />
            </Field>
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Required attendance</Label>
              <span className="text-sm font-display font-bold text-gradient">{required}%</span>
            </div>
            <Slider value={[required]} onValueChange={(v) => setRequired(v[0])} min={50} max={95} step={5} />
          </div>

          <Field label="Color">
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  type="button" key={c} onClick={() => setColor(c)}
                  className={cn("h-9 w-9 rounded-xl tap-scale ring-offset-2 ring-offset-background", color === c && "ring-2 ring-primary")}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
        </GlassCard>

        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Class schedule</Label>
            <button
              type="button"
              onClick={addPeriod}
              className="h-9 px-3 rounded-xl gradient-primary text-white text-xs font-bold flex items-center gap-1 tap-scale"
            >
              <Plus className="h-3.5 w-3.5" /> Add slot
            </button>
          </div>

          {periods.length === 0 && (
            <p className="text-xs text-muted-foreground">No time slots yet. Add one to see it on your timetable.</p>
          )}

          {periods.map((p, i) => (
            <div key={i} className="surface-low rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Slot {i + 1} · {fmtTime(p.start_time + ":00")} – {fmtTime(p.end_time + ":00")}
                </span>
                <button
                  type="button"
                  onClick={() => removePeriod(i)}
                  className="h-7 w-7 grid place-items-center rounded-lg text-destructive tap-scale"
                  aria-label="Remove slot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((d, di) => {
                  const on = p.day_of_week === di;
                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => updatePeriod(i, { day_of_week: di })}
                      aria-label={DAY_LABELS[di]}
                      className={cn(
                        "h-9 rounded-lg text-xs font-bold tap-scale",
                        on ? "gradient-primary text-white shadow-glow" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Start</Label>
                  <Input
                    type="time"
                    value={p.start_time}
                    onChange={(e) => updatePeriod(i, { start_time: e.target.value })}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">End</Label>
                  <Input
                    type="time"
                    value={p.end_time}
                    onChange={(e) => updatePeriod(i, { end_time: e.target.value })}
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>

              <Input
                value={p.room ?? ""}
                onChange={(e) => updatePeriod(i, { room: e.target.value })}
                placeholder="Room (optional)"
                className="h-10 rounded-lg text-sm"
              />
            </div>
          ))}
        </GlassCard>

        <Button
          type="submit"
          className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-semibold tap-scale"
          disabled={submitting || upsert.isPending || savePeriods.isPending}
        >
          {submitting ? "Saving…" : editing ? "Save changes" : "Add subject"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
