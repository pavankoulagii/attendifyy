import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const features = [
  "Unlimited subjects",
  "Zero ads, ever",
  "Smart AI predictions",
  "Detailed analytics & exports",
  "Premium themes & widgets",
  "Cloud backup & restore",
  "PDF attendance export",
  "Priority support",
];

const plans = [
  { id: "free", name: "Free", price: "₹0", sub: "Forever", desc: "Up to 5 subjects, basic tracking, ads", grad: "" },
  { id: "monthly", name: "Pro Monthly", price: "₹49", sub: "per month", desc: "Cancel anytime", grad: "gradient-primary", best: false },
  { id: "yearly", name: "Pro Yearly", price: "₹199", sub: "per year · save 66%", desc: "Best value", grad: "gradient-hero", best: true },
];

export default function Premium() {
  const nav = useNavigate();
  const [plan, setPlan] = useState("yearly");

  return (
    <div className="px-5 pt-8 pb-8 space-y-5 animate-fade-in">
      <header className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="h-10 w-10 rounded-2xl glass grid place-items-center tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">Attendify Pro</h1>
      </header>

      <div className="text-center space-y-2 py-4">
        <div className="inline-flex h-16 w-16 rounded-2xl gradient-warning shadow-glow items-center justify-center animate-float">
          <Crown className="h-8 w-8 text-warning-foreground" />
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight">
          Unlock <span className="text-gradient">everything</span>
        </h2>
        <p className="text-sm text-muted-foreground">Built for serious students. Loved by toppers.</p>
      </div>

      <div className="space-y-2.5">
        {plans.map((p) => (
          <button
            key={p.id} onClick={() => setPlan(p.id)}
            className={cn(
              "w-full text-left rounded-3xl p-4 border-2 tap-scale transition-all relative overflow-hidden",
              plan === p.id ? "border-primary shadow-glow" : "border-border glass"
            )}
          >
            {p.best && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning text-warning-foreground">BEST</div>
            )}
            {p.grad && plan === p.id && <div className={cn("absolute inset-0 opacity-10", p.grad)} />}
            <div className="relative flex items-center gap-3">
              <div className={cn("h-5 w-5 rounded-full border-2 grid place-items-center shrink-0",
                plan === p.id ? "border-primary bg-primary" : "border-border"
              )}>
                {plan === p.id && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="font-display font-bold text-lg">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <p className="text-xs text-muted-foreground">{p.sub}</p>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold">{p.price}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <GlassCard className="space-y-2.5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Pro features</p>
        {features.map((f) => (
          <div key={f} className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full gradient-primary grid place-items-center shadow-glow">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </GlassCard>

      <Button
        onClick={() => toast("Payments coming soon — UI preview only", { icon: "✨" as any })}
        className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-semibold tap-scale"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {plan === "free" ? "Continue free" : "Start free trial"}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">Auto-renews. Cancel anytime.</p>
    </div>
  );
}
