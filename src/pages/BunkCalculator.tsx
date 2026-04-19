import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubjects } from "@/lib/data";
import { classesToRecover, healthStatus, nextMissPercent, percent, safeBunks } from "@/lib/attendance";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Sparkles, ShieldAlert, Share2 } from "lucide-react";
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
    <div className="px-5 pt-8 pb-8 space-y-5 animate-fade-in">
      <header className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="h-10 w-10 rounded-2xl glass grid place-items-center tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">Bunk Calculator</h1>
      </header>

      {/* picker */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        <Chip active={pickedId === "all"} onClick={() => setPickedId("all")}>Overall</Chip>
        {subjects.map((s) => (
          <Chip key={s.id} active={pickedId === s.id} onClick={() => setPickedId(s.id)} color={s.color}>
            {s.name}
          </Chip>
        ))}
      </div>

      {/* hero verdict */}
      <GlassCard className={cn("text-center py-8 relative overflow-hidden",
        canBunk ? "ring-1 ring-success/30" : "ring-1 ring-destructive/30"
      )}>
        <div className={cn("absolute inset-0 opacity-20", canBunk ? "gradient-success" : "gradient-danger")} />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Can you bunk tomorrow?</div>
          <div className={cn("font-display text-6xl font-bold mt-2",
            canBunk ? "text-success" : "text-destructive"
          )}>
            {canBunk ? "YES" : "NO"}
          </div>
          <div className="text-sm mt-2">
            {canBunk
              ? <>You can miss <b>{sb}</b> more class{sb===1?"":"es"} 😎</>
              : <>Attend <b>{recover}</b> more class{recover===1?"":"es"} to be safe</>}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Current %" value={`${cur.toFixed(1)}%`} icon={Calculator} status={status} />
        <Tile label="If you miss next" value={`${nextP.toFixed(1)}%`} icon={ShieldAlert} status={status} />
        <Tile label="Safe to miss" value={isFinite(sb) ? sb : "∞"} icon={Sparkles} status="safe" />
        <Tile label="To recover" value={isFinite(recover) ? recover : "∞"} icon={ShieldAlert} status="critical" />
      </div>

      <Button onClick={share} className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow tap-scale">
        <Share2 className="h-4 w-4 mr-2" /> Share my stats
      </Button>
    </div>
  );
}

function Chip({ children, active, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap tap-scale border transition-all",
        active ? "gradient-primary text-primary-foreground border-transparent shadow-glow" : "bg-muted/50 border-border text-muted-foreground"
      )}
      style={active && color ? { background: color, color: "white" } : undefined}
    >{children}</button>
  );
}

function Tile({ label, value, icon: Icon, status }: any) {
  return (
    <GlassCard className="py-4">
      <Icon className={cn("h-4 w-4 mb-2",
        status === "safe" && "text-success",
        status === "warning" && "text-warning",
        status === "critical" && "text-destructive"
      )} />
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </GlassCard>
  );
}
