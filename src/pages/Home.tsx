import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useProfile, useSubjects } from "@/lib/data";
import { healthStatus, percent, safeBunks } from "@/lib/attendance";
import { accessibleSubjects } from "@/lib/freeTier";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const motivation = [
  "Consistency is the key to mastery. Keep showing up!",
  "Small wins. Big GPA.",
  "Bunk smart, never random.",
  "75% is the floor — not the goal.",
  "Future you will thank present you.",
];

export default function Home() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const nav = useNavigate();

  const stats = useMemo(() => {
    const totalHeld = subjects.reduce((a, s) => a + s.classes_held, 0);
    const totalAtt = subjects.reduce((a, s) => a + s.classes_attended, 0);
    const overall = percent(totalAtt, totalHeld);
    const required = profile?.required_attendance ?? 75;
    let risk = 0, totalSafeBunks = 0;
    subjects.forEach((s) => {
      const p = percent(s.classes_attended, s.classes_held);
      const st = healthStatus(p, Number(s.required_attendance));
      if (st === "critical") risk++;
      totalSafeBunks += safeBunks({ attended: s.classes_attended, held: s.classes_held, required: Number(s.required_attendance) });
    });
    return { overall, required, risk, totalSafeBunks };
  }, [subjects, profile]);

  const status = healthStatus(stats.overall, stats.required);
  const motivationLine = motivation[new Date().getDate() % motivation.length];
  const greetName = profile?.display_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  // Ring math
  const r = 84, C = 2 * Math.PI * r;
  const pct = isFinite(stats.overall) ? Math.min(100, Math.max(0, stats.overall)) : 0;
  const offset = C * (1 - pct / 100);

  const today = todaySubjects(subjects);

  return (
    <main className="px-5 pt-6 pb-8 space-y-8 animate-fade-in">
      {/* Greeting */}
      <section>
        <h2 className="font-headline font-extrabold text-3xl tracking-tight text-foreground">
          Hey {greetName} <span className="inline-block animate-float">👋</span>
        </h2>
        <p className="text-muted-foreground text-sm mt-1 font-medium">{motivationLine}</p>
      </section>

      {/* Hero metric — gradient bordered glass card */}
      <section>
        <div className="glass gradient-border rounded-xl p-7 flex flex-col items-center text-center gap-5 relative overflow-hidden">
          <div className="absolute -top-20 -right-16 w-56 h-56 gradient-primary opacity-10 rounded-full blur-3xl" />
          <div className="relative w-48 h-48 grid place-items-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r={r} fill="transparent" stroke="hsl(var(--surface-high))" strokeWidth="12" />
              <circle cx="96" cy="96" r={r} fill="transparent" stroke="url(#hero-grad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} />
              <defs>
                <linearGradient id="hero-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#4158D0" />
                  <stop offset="100%" stopColor="#C850C0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-headline font-black text-4xl tracking-tight">{Math.round(pct)}%</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Attendance</span>
            </div>
          </div>
          <div className="relative space-y-3">
            <div className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide",
              status === "safe" && "bg-secondary-container text-secondary-container-foreground",
              status === "warning" && "bg-warning/15 text-warning",
              status === "critical" && "bg-destructive-container text-destructive-container-foreground"
            )}>
              <span className="material-symbols-outlined ms-fill mr-1" style={{ fontSize: 14 }}>
                {status === "safe" ? "verified" : status === "warning" ? "warning" : "error"}
              </span>
              {status === "safe" ? "SAFE" : status === "warning" ? "WARNING" : "CRITICAL"}
            </div>
            <h3 className="font-headline font-bold text-2xl">Overall Attendance</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {status === "safe"
                ? <>You're safely above the {stats.required}% threshold. You can afford <b>{stats.totalSafeBunks}</b> more bunk{stats.totalSafeBunks===1?"":"s"} without falling into the risk zone.</>
                : status === "warning"
                ? <>You're close to the {stats.required}% threshold. Attend the next few classes to build a buffer.</>
                : <>You're below {stats.required}%. Attend upcoming classes to recover.</>}
            </p>
          </div>
        </div>
      </section>

      {/* Action buttons */}
      <section className="grid grid-cols-1 gap-3">
        <Button onClick={() => nav("/app/subjects")} className="gradient-primary text-white rounded-xl py-4 h-auto flex items-center justify-center gap-3 shadow-glow tap-scale border-0">
          <span className="material-symbols-outlined">how_to_reg</span>
          <span className="font-headline font-bold text-sm">Mark Attendance</span>
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => nav("/app/subjects/new")} variant="ghost" className="surface-high hover:bg-surface-highest text-primary rounded-xl py-4 h-auto flex items-center justify-center gap-2 tap-scale">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
            <span className="font-headline font-bold text-xs">Add Subject</span>
          </Button>
          <Button onClick={() => nav("/app/bunk")} variant="ghost" className="surface-high hover:bg-surface-highest text-primary rounded-xl py-4 h-auto flex items-center justify-center gap-2 tap-scale">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>calculate</span>
            <span className="font-headline font-bold text-xs">Bunk Calc</span>
          </Button>
        </div>
      </section>

      {/* Bento stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatTile icon="book" tone="primary" value={subjects.length} label="Subjects" />
        <StatTile icon="beach_access" tone="secondary" value={isFinite(stats.totalSafeBunks) ? stats.totalSafeBunks : "—"} label="Safe Bunks" />
        <StatTile icon="warning" tone="danger" value={stats.risk} label="Risk Subjects" />
        <StatTile icon="today" tone="accent" value={today.length} label="Today's Classes" />
      </section>

      {/* Today's schedule */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline font-bold text-xl">Today's Schedule</h3>
          <Link to="/app/timetable" className="text-primary text-sm font-bold tap-scale">View Calendar</Link>
        </div>
        {today.length === 0 ? (
          <div className="bg-card rounded-xl p-6 text-center shadow-card">
            <p className="text-muted-foreground text-sm">No classes scheduled today. Enjoy! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {today.map((s) => {
              const p = percent(s.classes_attended, s.classes_held);
              const st = healthStatus(p, Number(s.required_attendance));
              return (
                <Link to="/app/subjects" key={s.id} className="block tap-scale">
                  <div className={cn(
                    "bg-card rounded-xl p-5 flex items-center justify-between shadow-card",
                    st === "critical" && "border-l-4 border-destructive"
                  )}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full grid place-items-center text-white shrink-0" style={{ background: s.color }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu_book</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.faculty || "—"}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-bold shrink-0 ml-2",
                      st === "safe" && "text-secondary",
                      st === "warning" && "text-warning",
                      st === "critical" && "text-destructive"
                    )}>{Math.round(p)}% Att.</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {subjects.length === 0 && (
        <div className="bg-card rounded-xl p-8 text-center shadow-card">
          <p className="text-muted-foreground text-sm mb-3">No subjects yet. Add your first one to start tracking.</p>
          <Button onClick={() => nav("/app/subjects/new")} className="gradient-primary text-white rounded-xl border-0 shadow-glow">
            <span className="material-symbols-outlined mr-2" style={{ fontSize: 18 }}>add</span>
            Add Subject
          </Button>
        </div>
      )}
    </main>
  );
}

function StatTile({ icon, tone, value, label }: { icon: string; tone: "primary"|"secondary"|"danger"|"accent"; value: any; label: string }) {
  const isDanger = tone === "danger";
  return (
    <div className={cn(
      "rounded-xl p-5 transition-colors",
      isDanger ? "bg-destructive-container" : "surface-low hover:bg-surface-high"
    )}>
      <span className={cn(
        "material-symbols-outlined block mb-3",
        tone === "primary" && "text-primary",
        tone === "secondary" && "text-secondary",
        tone === "danger" && "text-destructive-container-foreground",
        tone === "accent" && "text-accent",
      )} style={{ fontSize: 24 }}>{icon}</span>
      <p className={cn("text-2xl font-headline font-bold", isDanger && "text-destructive-container-foreground")}>{value}</p>
      <p className={cn("text-xs font-semibold opacity-70", isDanger ? "text-destructive-container-foreground" : "text-muted-foreground")}>{label}</p>
    </div>
  );
}

function todaySubjects(subjects: any[]) {
  const dow = new Date().getDay();
  return subjects.filter((s) => Array.isArray(s.weekly_schedule) && s.weekly_schedule.includes(dow));
}
