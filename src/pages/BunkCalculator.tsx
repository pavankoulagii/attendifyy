import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubjects } from "@/lib/data";
import { classesToRecover, healthStatus, nextMissPercent, percent, safeBunks } from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BunkCalculator() {
  const nav = useNavigate();
  const { data: subjects = [] } = useSubjects();
  const [pickedId, setPickedId] = useState<string | "all">("all");

  const overallHeld = subjects.reduce((a, s) => a + s.classes_held, 0);
  const overallAtt = subjects.reduce((a, s) => a + s.classes_attended, 0);
  const overallReq = subjects[0] ? Number(subjects[0].required_attendance) : 75;

  const stats = pickedId === "all"
    ? { attended: overallAtt, held: overallHeld, required: overallReq, name: "Overall" }
    : (() => {
        const s = subjects.find((x) => x.id === pickedId)!;
        return { attended: s.classes_attended, held: s.classes_held, required: Number(s.required_attendance), name: s.name };
      })();

  const cur = percent(stats.attended, stats.held);
  const sb = safeBunks(stats);
  const nextP = nextMissPercent(stats);
  const recover = classesToRecover(stats);
  const canBunk = sb > 0;
  const status = healthStatus(cur, stats.required);

  // Recovery ring
  const r = 40, C = 2 * Math.PI * r;
  const recoverPct = isFinite(recover) && recover > 0 ? Math.min(100, (recover / 10) * 100) : 100;
  const offset = C * (1 - recoverPct / 100);

  const share = async () => {
    const text = `📊 Attendify\n${stats.name}: ${cur.toFixed(1)}%\nI can ${canBunk ? `bunk ${sb} more class${sb===1?"":"es"} 😎` : `NOT bunk — attend ${recover} more 📚`}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Attendify", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <main className="px-5 pt-4 pb-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="h-10 w-10 rounded-full surface-low grid place-items-center tap-scale">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
        <h1 className="font-headline font-extrabold text-2xl tracking-tight">Bunk Calculator</h1>
      </div>

      {/* Subject picker */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        <Chip active={pickedId === "all"} onClick={() => setPickedId("all")}>Overall</Chip>
        {subjects.map((s) => (
          <Chip key={s.id} active={pickedId === s.id} onClick={() => setPickedId(s.id)}>
            {s.name}
          </Chip>
        ))}
      </div>

      {/* Hero verdict */}
      <section className="glass rounded-xl p-7 shadow-card relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 gradient-primary opacity-10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="font-headline font-extrabold text-3xl text-foreground tracking-tight leading-tight mb-3">
            {canBunk ? (
              <>You can miss <span className="text-gradient">{sb} more</span> class{sb===1?"":"es"} safely 😎</>
            ) : (
              <>Don't bunk — attend <span className="text-gradient">{recover} more</span> to recover 📚</>
            )}
          </h2>
          <p className="text-muted-foreground font-medium text-base">
            {canBunk ? "Maintain your academic luxury. Your buffer is currently optimal." : "You're below the safety threshold. Time to lock in."}
          </p>
        </div>
      </section>

      {/* Risk + Verdict bento */}
      <div className="space-y-4">
        {/* Prediction */}
        <section className="surface-low rounded-xl p-6 flex flex-col gap-6">
          <div className="flex justify-between items-start gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Risk Assessment</span>
              <h3 className="font-headline font-bold text-xl">If absent next class:</h3>
            </div>
            <div className="text-right shrink-0">
              <span className={cn(
                "font-headline font-black text-3xl",
                nextP < stats.required ? "text-destructive" : "text-primary"
              )}>{nextP.toFixed(1)}%</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Projected</p>
            </div>
          </div>
          <div className="bg-card/70 rounded-lg p-4 flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full grid place-items-center shrink-0",
              nextP < stats.required ? "bg-destructive-container text-destructive-container-foreground" : "bg-secondary-container text-secondary-container-foreground"
            )}>
              <span className="material-symbols-outlined">{nextP < stats.required ? "warning" : "check_circle"}</span>
            </div>
            <p className="text-sm font-medium">
              {nextP < stats.required
                ? <>Will drop below the <b>{stats.required}% threshold</b>. Caution advised.</>
                : <>You'll still be safely above <b>{stats.required}%</b>.</>}
            </p>
          </div>
        </section>

        {/* Can bunk? Toggle */}
        <section className="bg-card rounded-xl p-6 flex flex-col items-center text-center shadow-card">
          <h4 className="font-headline font-bold text-lg mb-5">Can bunk tomorrow?</h4>
          <div className="flex surface-high p-1.5 rounded-full w-full max-w-[220px]">
            <div className={cn(
              "flex-1 py-3 px-6 rounded-full font-headline font-bold transition-all text-sm",
              canBunk ? "bg-card shadow-soft text-primary" : "text-muted-foreground"
            )}>YES</div>
            <div className={cn(
              "flex-1 py-3 px-6 rounded-full font-headline font-bold transition-all text-sm",
              !canBunk ? "bg-card shadow-soft text-destructive" : "text-muted-foreground"
            )}>NO</div>
          </div>
        </section>

        {/* Recovery roadmap */}
        <section className="gradient-primary rounded-xl p-[1.5px]">
          <div className="bg-card rounded-[calc(1.375rem-1.5px)] p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 min-w-0">
              <div className="relative w-24 h-24 grid place-items-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r={r} fill="transparent" stroke="hsl(var(--surface-high))" strokeWidth="8" />
                  <circle cx="48" cy="48" r={r} fill="transparent" stroke="url(#rec-grad)" strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="8" />
                  <defs>
                    <linearGradient id="rec-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#4158D0" />
                      <stop offset="100%" stopColor="#C850C0" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute font-headline font-black text-2xl">{isFinite(recover) ? recover : "∞"}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-headline font-extrabold text-xl mb-1">Recovery</h3>
                <p className="text-muted-foreground text-sm">
                  {isFinite(recover) && recover > 0
                    ? <>Attend <span className="text-primary font-bold">{recover} more</span> to recover.</>
                    : <>You're already in the safe zone ✨</>}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Subject breakdown */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="font-headline font-bold text-xl">Subject Breakdown</h3>
        </div>
        <div className="space-y-3">
          {subjects.map((s) => {
            const p = percent(s.classes_attended, s.classes_held);
            const req = Number(s.required_attendance);
            const st = healthStatus(p, req);
            const sbi = safeBunks({ attended: s.classes_attended, held: s.classes_held, required: req });
            return (
              <div key={s.id} className="bg-card rounded-xl p-5 flex items-center justify-between gap-3 shadow-soft">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 text-white" style={{ background: s.color }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu_book</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground truncate">{s.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {sbi} bunk{sbi===1?"":"s"} left{st==="critical" && " • Critical"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn("text-xs font-bold mb-1",
                    st === "safe" && "text-secondary",
                    st === "warning" && "text-warning",
                    st === "critical" && "text-destructive"
                  )}>{p.toFixed(1)}%</div>
                  <div className="w-24 h-2 surface-high rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      st === "critical" ? "bg-destructive" : "gradient-primary"
                    )} style={{ width: `${Math.min(100, p)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Button onClick={share} className="w-full gradient-primary text-white border-0 rounded-xl h-14 shadow-glow tap-scale">
        <span className="material-symbols-outlined mr-2">share</span>
        Share my stats
      </Button>
    </main>
  );
}

function Chip({ children, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-headline font-bold whitespace-nowrap tap-scale transition-all",
        active ? "gradient-primary text-white shadow-glow" : "surface-low text-muted-foreground hover:bg-surface-high"
      )}
    >{children}</button>
  );
}
