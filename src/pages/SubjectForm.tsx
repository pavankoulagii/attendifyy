import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSubjects, useUpsertSubject } from "@/lib/data";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ["#7c3aed", "#3b82f6", "#06b6d4", "#10b981", "#eab308", "#f97316", "#ef4444", "#ec4899"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function SubjectForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const { data: subjects = [] } = useSubjects();
  const editing = id ? subjects.find((s) => s.id === id) : null;
  const upsert = useUpsertSubject();

  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [held, setHeld] = useState(0);
  const [attended, setAttended] = useState(0);
  const [required, setRequired] = useState(75);
  const [color, setColor] = useState(COLORS[0]);
  const [schedule, setSchedule] = useState<number[]>([]);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setFaculty(editing.faculty ?? "");
      setHeld(editing.classes_held);
      setAttended(editing.classes_attended);
      setRequired(Number(editing.required_attendance));
      setColor(editing.color);
      setSchedule(Array.isArray(editing.weekly_schedule) ? editing.weekly_schedule : []);
    }
  }, [editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attended > held) return toast.error("Attended can't exceed held");
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        name: name.trim(),
        faculty: faculty.trim() || null,
        classes_held: held,
        classes_attended: attended,
        required_attendance: required,
        color,
        weekly_schedule: schedule as any,
      });
      toast.success(editing ? "Updated" : "Subject added 🎉");
      nav(-1);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="px-5 pt-8 space-y-5 animate-fade-in">
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

          <Field label="Weekly schedule">
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d, i) => {
                const on = schedule.includes(i);
                return (
                  <button
                    key={i} type="button"
                    onClick={() => setSchedule(on ? schedule.filter((x) => x !== i) : [...schedule, i])}
                    className={cn(
                      "h-11 rounded-xl text-xs font-semibold tap-scale",
                      on ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
                    )}
                  >{d}</button>
                );
              })}
            </div>
          </Field>
        </GlassCard>

        <Button type="submit" className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-semibold tap-scale" disabled={upsert.isPending}>
          {editing ? "Save changes" : "Add subject"}
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
