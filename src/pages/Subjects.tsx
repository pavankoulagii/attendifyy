import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteSubject, useMarkAttendance, useSubjects, useProfile, type Subject } from "@/lib/data";
import { healthStatus, percent, safeBunks } from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";

const FREE_SUBJECT_LIMIT = 5;

export default function Subjects() {
  const nav = useNavigate();
  const { data: subjects = [], isLoading } = useSubjects();
  const { data: profile } = useProfile();
  const mark = useMarkAttendance();
  const del = useDeleteSubject();
  const [, setActive] = useState<Subject | null>(null);
  const isPremium = !!profile?.is_premium;
  const atLimit = !isPremium && subjects.length >= FREE_SUBJECT_LIMIT;

  const handleAdd = (e: React.MouseEvent) => {
    if (atLimit) {
      e.preventDefault();
      toast.error(`Free plan: ${FREE_SUBJECT_LIMIT} subjects only. Upgrade to Pro for unlimited.`);
      nav("/app/premium");
    }
  };

  // overall
  const totalHeld = subjects.reduce((a, s) => a + s.classes_held, 0);
  const totalAtt = subjects.reduce((a, s) => a + s.classes_attended, 0);
  const overall = totalHeld === 0 ? 0 : (totalAtt / totalHeld) * 100;
  const r = 26, C = 2 * Math.PI * r;
  const offset = C * (1 - Math.min(100, overall) / 100);

  return (
    <main className="px-5 pt-6 pb-8 animate-fade-in">
      {/* Hero Section */}
      <section className="mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline font-extrabold text-3xl tracking-tight">Your Courses</h2>
          <p className="text-muted-foreground text-sm font-medium">
            Tracking {subjects.length} active subject{subjects.length === 1 ? "" : "s"} this semester
          </p>
        </div>

        {/* Overall stat bar */}
        <div className="surface-low rounded-xl p-6 flex items-center justify-between mt-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Overall Average</p>
            <p className="text-4xl font-headline font-black">{overall.toFixed(1)}%</p>
          </div>
          <div className="w-16 h-16 relative grid place-items-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--surface-high))" strokeWidth="6" />
              <circle cx="32" cy="32" r={r} fill="none" stroke="url(#sub-grad)" strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="6" />
              <defs>
                <linearGradient id="sub-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#4158D0" />
                  <stop offset="100%" stopColor="#C850C0" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[10px] font-bold">{Math.round(overall)}%</span>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl animate-shimmer" />)}</div>
      )}

      {!isLoading && subjects.length === 0 && (
        <div className="bg-card rounded-xl text-center py-10 shadow-card">
          <div className="text-5xl mb-2">📸</div>
          <p className="font-headline font-bold">No subjects yet</p>
          <p className="text-sm text-muted-foreground mb-4 px-6">Snap a photo of your timetable — AI will set everything up.</p>
          <Link to="/app/subjects/new">
            <Button className="gradient-primary border-0 rounded-xl text-white shadow-glow">
              <span className="material-symbols-outlined mr-2" style={{ fontSize: 18 }}>add_a_photo</span>
              Scan timetable
            </Button>
          </Link>
        </div>
      )}

      {/* Subject cards */}
      <div className="space-y-5">
        {subjects.map((s) => {
          const p = percent(s.classes_attended, s.classes_held);
          const req = Number(s.required_attendance);
          const st = healthStatus(p, req);
          const sb = safeBunks({ attended: s.classes_attended, held: s.classes_held, required: req });
          const recover = needToRecover(s);

          return (
            <Drawer key={s.id} onOpenChange={(o) => o && setActive(s)}>
              <DrawerTrigger asChild>
                <button className="w-full text-left tap-scale">
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div className="min-w-0">
                        <h3 className="font-headline font-bold text-xl text-foreground leading-tight truncate">{s.name}</h3>
                        <p className="text-sm text-muted-foreground font-medium truncate">{s.faculty || "—"}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-2xl font-headline font-black text-primary">{Math.round(p)}%</span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full mt-1",
                          st === "safe" && "bg-secondary-container text-secondary-container-foreground",
                          st === "warning" && "bg-warning/15 text-warning",
                          st === "critical" && "bg-destructive-container text-destructive-container-foreground"
                        )}>
                          {st === "safe" ? "Excellent" : st === "warning" ? "Warning" : "Critical"}
                        </span>
                      </div>
                    </div>

                    {/* Gradient progress bar */}
                    <div className="w-full h-3 bg-surface-mid rounded-full overflow-hidden mb-4">
                      <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${Math.min(100, p)}%` }} />
                    </div>

                    <div className="flex justify-between items-center pt-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", st === "critical" ? "bg-destructive" : "bg-primary")} />
                        <p className="text-xs font-semibold text-foreground truncate">
                          Safe bunks: <span className={cn(st === "critical" ? "text-destructive" : "text-primary")}>{sb} left</span>
                        </p>
                      </div>
                      <div className="surface-low px-3 py-1.5 rounded-full shrink-0">
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {p < req
                            ? <>Need <span className="text-primary">{recover} more</span> to recover</>
                            : sb > 3
                            ? <>Top of the class 🔥</>
                            : <>Stay focused ✨</>}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </DrawerTrigger>
              <DrawerContent className="px-5 pb-8">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="font-headline">{s.name}</DrawerTitle>
                </DrawerHeader>
                <div className="grid grid-cols-3 gap-3">
                  <ActionBtn label="Present" icon="check_circle" tone="success" onClick={() => { mark.mutate({ subject: s, status: "present" }); toast.success(`${s.name}: Present ✅`); }} />
                  <ActionBtn label="Absent" icon="cancel" tone="danger" onClick={() => { mark.mutate({ subject: s, status: "absent" }); toast(`${s.name}: Absent`); }} />
                  <ActionBtn label="Cancelled" icon="event_busy" tone="muted" onClick={() => { mark.mutate({ subject: s, status: "cancelled" }); toast(`${s.name}: Cancelled`); }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link to={`/app/subjects/${s.id}/edit`} className="contents">
                    <Button variant="outline" className="rounded-xl h-12 border-0 surface-high text-primary">
                      <span className="material-symbols-outlined mr-2" style={{ fontSize: 18 }}>edit</span>Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 border-0 bg-destructive-container text-destructive-container-foreground"
                    onClick={() => { if (confirm(`Delete ${s.name}?`)) { del.mutate(s.id); toast(`Deleted`); } }}
                  >
                    <span className="material-symbols-outlined mr-2" style={{ fontSize: 18 }}>delete</span>Delete
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          );
        })}
      </div>

      {/* FAB */}
      <Link to="/app/subjects/new" className="fixed bottom-28 right-6 z-40">
        <button className="w-16 h-16 gradient-primary text-white rounded-full grid place-items-center shadow-glow tap-scale">
          <span className="material-symbols-outlined" style={{ fontSize: 30 }}>add</span>
        </button>
      </Link>
    </main>
  );
}

function needToRecover(s: Subject) {
  const r = Number(s.required_attendance) / 100;
  if (r >= 1) return "∞";
  return Math.max(0, Math.ceil((r * s.classes_held - s.classes_attended) / (1 - r)));
}

function ActionBtn({ label, icon, tone, onClick }: { label: string; icon: string; tone: "success"|"danger"|"muted"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl py-4 flex flex-col items-center gap-1 tap-scale",
        tone === "success" && "gradient-primary text-white shadow-glow",
        tone === "danger" && "bg-destructive-container text-destructive-container-foreground",
        tone === "muted" && "surface-high text-foreground",
      )}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      <span className="text-xs font-headline font-bold">{label}</span>
    </button>
  );
}
