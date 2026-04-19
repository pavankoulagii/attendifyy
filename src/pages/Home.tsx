import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useProfile, useSubjects } from "@/lib/data";
import { healthLabel, healthStatus, percent, safeBunks } from "@/lib/attendance";
import ProgressRing from "@/components/ProgressRing";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { BookOpen, Calculator, Plus, Sparkles, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const motivation = [
  "Small wins. Big GPA.",
  "Show up. Future you smiles.",
  "Bunk smart, not random.",
  "75% is the floor, not the goal.",
  "One class today = one less stress later.",
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
    let safe = 0, risk = 0;
    let totalSafeBunks = 0;
    subjects.forEach((s) => {
      const p = percent(s.classes_attended, s.classes_held);
      const st = healthStatus(p, Number(s.required_attendance));
      if (st === "critical") risk++;
      else safe++;
      totalSafeBunks += safeBunks({ attended: s.classes_attended, held: s.classes_held, required: Number(s.required_attendance) });
    });
    return { overall, required, safe, risk, totalSafeBunks };
  }, [subjects, profile]);

  const status = healthStatus(stats.overall, stats.required);
  const motivationLine = motivation[new Date().getDate() % motivation.length];
  const greetName = profile?.display_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="px-5 pt-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hey {greetName} 👋</p>
          <h1 className="font-display text-2xl font-bold leading-tight">
            <span className="text-gradient">{motivationLine}</span>
          </h1>
        </div>
        <button className="h-11 w-11 rounded-2xl glass grid place-items-center tap-scale" aria-label="Alerts">
          <Bell className="h-5 w-5" />
        </button>
      </header>

      {/* Hero ring */}
      <GlassCard className="flex flex-col items-center text-center py-7">
        <ProgressRing value={isFinite(stats.overall) ? stats.overall : 0} size={200} stroke={16}>
          <div>
            <div className="text-4xl font-display font-bold">{Math.round(stats.overall)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Overall</div>
          </div>
        </ProgressRing>
        <div
          className={cn(
            "mt-4 px-4 py-1.5 rounded-full text-xs font-semibold",
            status === "safe" && "bg-success/15 text-success",
            status === "warning" && "bg-warning/15 text-warning",
            status === "critical" && "bg-destructive/15 text-destructive"
          )}
        >
          {healthLabel[status]} · target {stats.required}%
        </div>
      </GlassCard>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Subjects" value={subjects.length} icon={BookOpen} grad="gradient-primary" />
        <StatCard label="Safe bunks" value={isFinite(stats.totalSafeBunks) ? stats.totalSafeBunks : "—"} icon={Sparkles} grad="gradient-success" />
        <StatCard label="At risk" value={stats.risk} icon={Bell} grad="gradient-danger" />
        <StatCard label="Today's classes" value={todayCount(subjects)} icon={Calculator} grad="gradient-warning" />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button onClick={() => nav("/app/subjects")} className="h-14 rounded-2xl gradient-primary shadow-glow border-0 flex flex-col gap-0.5 tap-scale">
          <span className="text-xs font-semibold">Mark</span>
        </Button>
        <Button onClick={() => nav("/app/subjects/new")} variant="outline" className="h-14 rounded-2xl flex flex-col gap-0.5 tap-scale">
          <Plus className="h-4 w-4" />
          <span className="text-xs font-semibold">Add</span>
        </Button>
        <Button onClick={() => nav("/app/bunk")} variant="outline" className="h-14 rounded-2xl flex flex-col gap-0.5 tap-scale">
          <Calculator className="h-4 w-4" />
          <span className="text-xs font-semibold">Calc</span>
        </Button>
      </div>

      {/* Subject preview list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold">Your subjects</h2>
          <Link to="/app/subjects" className="text-xs text-primary font-semibold">See all</Link>
        </div>
        {subjects.length === 0 ? (
          <GlassCard className="text-center py-8">
            <p className="text-muted-foreground text-sm">No subjects yet. Tap + to add your first one.</p>
            <Button onClick={() => nav("/app/subjects/new")} className="mt-3 gradient-primary border-0 rounded-xl">Add subject</Button>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {subjects.slice(0, 4).map((s) => {
              const p = percent(s.classes_attended, s.classes_held);
              const st = healthStatus(p, Number(s.required_attendance));
              return (
                <Link to={`/app/subjects`} key={s.id}>
                  <GlassCard className="flex items-center gap-3 py-3 active:scale-[0.99] transition-transform">
                    <div className="h-10 w-10 rounded-xl shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.classes_attended}/{s.classes_held} classes</p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-display font-bold",
                        st === "safe" && "text-success",
                        st === "warning" && "text-warning",
                        st === "critical" && "text-destructive"
                      )}>{Math.round(p)}%</div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, grad }: { label: string; value: any; icon: any; grad: string }) {
  return (
    <GlassCard className="py-4">
      <div className={cn("h-9 w-9 rounded-xl grid place-items-center mb-2", grad)}>
        <Icon className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="text-2xl font-display font-bold leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </GlassCard>
  );
}

function todayCount(subjects: any[]) {
  const dow = new Date().getDay();
  return subjects.reduce((n, s) => n + ((Array.isArray(s.weekly_schedule) && s.weekly_schedule.includes(dow)) ? 1 : 0), 0);
}
