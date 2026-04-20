import { useState } from "react";
import { useMarkAttendance, useSubjects, type Subject } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { percent, healthStatus } from "@/lib/attendance";

const DAYS = [
  { short: "S", long: "Sun" },
  { short: "M", long: "Mon" },
  { short: "T", long: "Tue" },
  { short: "W", long: "Wed" },
  { short: "T", long: "Thu" },
  { short: "F", long: "Fri" },
  { short: "S", long: "Sat" },
];

export default function Timetable() {
  const { data: subjects = [] } = useSubjects();
  const [day, setDay] = useState<number>(new Date().getDay());
  const mark = useMarkAttendance();

  const todays = subjects.filter(
    (s) => Array.isArray(s.weekly_schedule) && s.weekly_schedule.includes(day),
  );

  return (
    <main className="px-5 pt-6 pb-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight">Timetable</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Tap a class to mark attendance instantly
        </p>
      </header>

      {/* Day selector */}
      <section className="grid grid-cols-7 gap-2">
        {DAYS.map((d, i) => {
          const active = day === i;
          return (
            <button
              key={i}
              onClick={() => setDay(i)}
              className={cn(
                "py-3 rounded-2xl flex flex-col items-center gap-0.5 tap-scale transition-all",
                active
                  ? "gradient-primary text-white shadow-glow"
                  : "surface-low text-muted-foreground hover:bg-surface-mid",
              )}
            >
              <span className="font-headline font-bold text-sm">{d.short}</span>
              <span className="text-[9px] font-bold opacity-80">{d.long.slice(1)}</span>
            </button>
          );
        })}
      </section>

      {/* Class list */}
      {todays.length === 0 ? (
        <div className="bg-card rounded-xl p-10 text-center shadow-card">
          <div className="text-5xl mb-2">🎉</div>
          <p className="font-headline font-bold text-lg">No classes</p>
          <p className="text-sm text-muted-foreground font-medium">Enjoy your day off!</p>
        </div>
      ) : (
        <section className="space-y-4">
          {todays.map((s) => (
            <ClassCard
              key={s.id}
              subject={s}
              onMark={(st) => {
                mark.mutate({ subject: s, status: st });
                toast.success(`${s.name}: ${st}`);
              }}
            />
          ))}
        </section>
      )}
    </main>
  );
}

function ClassCard({
  subject,
  onMark,
}: {
  subject: Subject;
  onMark: (s: "present" | "absent" | "cancelled") => void;
}) {
  const p = percent(subject.classes_attended, subject.classes_held);
  const st = healthStatus(p, Number(subject.required_attendance));
  return (
    <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-full grid place-items-center text-white shrink-0 shadow-soft"
          style={{ background: subject.color }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu_book</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-base truncate">{subject.name}</p>
          <p className="text-xs text-muted-foreground font-medium truncate">{subject.faculty || "—"}</p>
        </div>
        <span
          className={cn(
            "text-sm font-headline font-black shrink-0",
            st === "safe" && "text-secondary",
            st === "warning" && "text-warning",
            st === "critical" && "text-destructive",
          )}
        >
          {Math.round(p)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <ActionBtn icon="check_circle" label="Present" tone="success" onClick={() => onMark("present")} />
        <ActionBtn icon="cancel" label="Absent" tone="danger" onClick={() => onMark("absent")} />
        <ActionBtn icon="event_busy" label="Cancel" tone="muted" onClick={() => onMark("cancelled")} />
      </div>
    </div>
  );
}

function ActionBtn({
  icon, label, tone, onClick,
}: {
  icon: string; label: string; tone: "success" | "danger" | "muted"; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl py-3 flex flex-col items-center gap-1 tap-scale transition-all",
        tone === "success" && "gradient-primary text-white shadow-glow",
        tone === "danger" && "bg-destructive-container text-destructive-container-foreground",
        tone === "muted" && "surface-low text-foreground hover:bg-surface-mid",
      )}
    >
      <span className="material-symbols-outlined ms-fill" style={{ fontSize: 22 }}>{icon}</span>
      <span className="text-[11px] font-headline font-bold">{label}</span>
    </button>
  );
}
