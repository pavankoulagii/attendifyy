import { useState } from "react";
import { useMarkAttendance, useSubjects, type Subject } from "@/lib/data";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import { Check, X, Ban } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Timetable() {
  const { data: subjects = [] } = useSubjects();
  const [day, setDay] = useState<number>(new Date().getDay());
  const mark = useMarkAttendance();

  const todays = subjects.filter((s) => Array.isArray(s.weekly_schedule) && s.weekly_schedule.includes(day));

  return (
    <div className="px-5 pt-8 space-y-5 animate-fade-in">
      <header>
        <h1 className="font-display text-2xl font-bold">Timetable</h1>
        <p className="text-xs text-muted-foreground">Tap a class to mark attendance</p>
      </header>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d, i) => (
          <button
            key={i} onClick={() => setDay(i)}
            className={cn(
              "py-3 rounded-2xl text-[11px] font-semibold tap-scale flex flex-col items-center gap-0.5",
              day === i ? "gradient-primary text-primary-foreground shadow-glow" : "glass text-muted-foreground"
            )}
          >
            <span>{d.slice(0,1)}</span>
            <span className="text-[9px] opacity-70">{d.slice(1)}</span>
          </button>
        ))}
      </div>

      {todays.length === 0 ? (
        <GlassCard className="text-center py-10">
          <div className="text-4xl mb-1">🎉</div>
          <p className="font-semibold">No classes</p>
          <p className="text-xs text-muted-foreground">Enjoy your day off!</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {todays.map((s) => <ClassCard key={s.id} subject={s} onMark={(st) => { mark.mutate({ subject: s, status: st }); toast.success(`${s.name}: ${st}`); }} />)}
        </div>
      )}
    </div>
  );
}

function ClassCard({ subject, onMark }: { subject: Subject; onMark: (s: "present" | "absent" | "cancelled") => void }) {
  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full" style={{ background: subject.color }} />
        <div className="flex-1">
          <p className="font-semibold">{subject.name}</p>
          <p className="text-xs text-muted-foreground">{subject.faculty || "—"}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onMark("present")} className="rounded-xl py-3 gradient-success text-primary-foreground flex items-center justify-center gap-1 tap-scale shadow-glow">
          <Check className="h-4 w-4" /><span className="text-xs font-semibold">Present</span>
        </button>
        <button onClick={() => onMark("absent")} className="rounded-xl py-3 gradient-danger text-primary-foreground flex items-center justify-center gap-1 tap-scale shadow-glow">
          <X className="h-4 w-4" /><span className="text-xs font-semibold">Absent</span>
        </button>
        <button onClick={() => onMark("cancelled")} className="rounded-xl py-3 gradient-warning text-warning-foreground flex items-center justify-center gap-1 tap-scale shadow-glow">
          <Ban className="h-4 w-4" /><span className="text-xs font-semibold">Cancel</span>
        </button>
      </div>
    </GlassCard>
  );
}
