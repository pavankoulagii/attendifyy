import { useState } from "react";
import { Link } from "react-router-dom";
import { useDeleteSubject, useMarkAttendance, useSubjects, type Subject } from "@/lib/data";
import { healthStatus, percent, safeBunks } from "@/lib/attendance";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Plus, Check, X, Ban, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";

export default function Subjects() {
  const { data: subjects = [], isLoading } = useSubjects();
  const mark = useMarkAttendance();
  const del = useDeleteSubject();
  const [active, setActive] = useState<Subject | null>(null);

  return (
    <div className="px-5 pt-8 space-y-5 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Subjects</h1>
          <p className="text-xs text-muted-foreground">Tap a subject to mark attendance</p>
        </div>
        <Link to="/app/subjects/new">
          <Button size="icon" className="h-11 w-11 rounded-2xl gradient-primary border-0 shadow-glow tap-scale">
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {isLoading && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-3xl animate-shimmer" />)}</div>}

      {!isLoading && subjects.length === 0 && (
        <GlassCard className="text-center py-10">
          <div className="text-5xl mb-2">📚</div>
          <p className="font-semibold">No subjects yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add your first subject to start tracking.</p>
          <Link to="/app/subjects/new">
            <Button className="gradient-primary border-0 rounded-xl">Add subject</Button>
          </Link>
        </GlassCard>
      )}

      <div className="space-y-3">
        {subjects.map((s) => {
          const p = percent(s.classes_attended, s.classes_held);
          const req = Number(s.required_attendance);
          const st = healthStatus(p, req);
          const sb = safeBunks({ attended: s.classes_attended, held: s.classes_held, required: req });

          return (
            <Drawer key={s.id} onOpenChange={(o) => o && setActive(s)}>
              <DrawerTrigger asChild>
                <button className="w-full text-left">
                  <GlassCard className="space-y-3 active:scale-[0.99] transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl shrink-0 grid place-items-center text-white font-bold" style={{ background: s.color }}>
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.faculty || "—"} · {s.classes_attended}/{s.classes_held}</p>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-display text-xl font-bold leading-none",
                          st === "safe" && "text-success",
                          st === "warning" && "text-warning",
                          st === "critical" && "text-destructive"
                        )}>{Math.round(p)}%</div>
                        <div className="text-[10px] text-muted-foreground">target {req}%</div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          st === "safe" && "gradient-success",
                          st === "warning" && "gradient-warning",
                          st === "critical" && "gradient-danger"
                        )}
                        style={{ width: `${Math.min(100, p)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{sb > 0 ? `Can bunk ${sb}` : "Don't bunk"}</span>
                      <span>{p < req ? `Attend ${needToRecover(s)} to recover` : "On track ✨"}</span>
                    </div>
                  </GlassCard>
                </button>
              </DrawerTrigger>
              <DrawerContent className="px-5 pb-8">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="font-display">{s.name}</DrawerTitle>
                </DrawerHeader>
                <div className="grid grid-cols-3 gap-3">
                  <ActionBtn label="Present" icon={Check} grad="gradient-success" onClick={() => { mark.mutate({ subject: s, status: "present" }); toast.success(`${s.name}: Present ✅`); }} />
                  <ActionBtn label="Absent" icon={X} grad="gradient-danger" onClick={() => { mark.mutate({ subject: s, status: "absent" }); toast(`${s.name}: Absent`); }} />
                  <ActionBtn label="Cancelled" icon={Ban} grad="gradient-warning" onClick={() => { mark.mutate({ subject: s, status: "cancelled" }); toast(`${s.name}: Cancelled`); }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link to={`/app/subjects/${s.id}/edit`} className="contents">
                    <Button variant="outline" className="rounded-xl h-12"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 text-destructive border-destructive/30"
                    onClick={() => { if (confirm(`Delete ${s.name}?`)) { del.mutate(s.id); toast(`Deleted`); } }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />Delete
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          );
        })}
      </div>
    </div>
  );
}

function needToRecover(s: Subject) {
  const r = Number(s.required_attendance) / 100;
  if (r >= 1) return "∞";
  return Math.max(0, Math.ceil((r * s.classes_held - s.classes_attended) / (1 - r)));
}

function ActionBtn({ label, icon: Icon, grad, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-2xl py-4 flex flex-col items-center gap-1 text-primary-foreground tap-scale shadow-glow", grad)}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
