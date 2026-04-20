import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const features = [
  { icon: "all_inclusive", text: "Unlimited subjects" },
  { icon: "block", text: "Zero ads, ever" },
  { icon: "auto_awesome", text: "Smart AI predictions" },
  { icon: "insights", text: "Detailed analytics & exports" },
  { icon: "palette", text: "Premium themes & widgets" },
  { icon: "cloud_sync", text: "Cloud backup & restore" },
  { icon: "picture_as_pdf", text: "PDF attendance export" },
  { icon: "support_agent", text: "Priority support" },
];

const plans = [
  { id: "free", name: "Free", price: "₹0", sub: "Forever", desc: "Up to 5 subjects" },
  { id: "monthly", name: "Pro Monthly", price: "₹49", sub: "per month", desc: "Cancel anytime" },
  { id: "yearly", name: "Pro Yearly", price: "₹199", sub: "per year · save 66%", desc: "Best value", best: true },
];

export default function Premium() {
  const nav = useNavigate();
  const [plan, setPlan] = useState("yearly");

  return (
    <main className="px-5 pt-6 pb-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="h-11 w-11 rounded-full glass grid place-items-center text-primary tap-scale shadow-soft">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
        <h1 className="font-headline font-extrabold text-2xl tracking-tight">Attendify Pro</h1>
      </header>

      {/* Hero */}
      <section className="text-center space-y-3 py-4 relative">
        <div className="inline-grid h-20 w-20 rounded-[28px] gradient-hero shadow-glow place-items-center animate-float">
          <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 38 }}>workspace_premium</span>
        </div>
        <h2 className="font-headline font-extrabold text-4xl leading-tight tracking-tight">
          Unlock <span className="text-gradient">everything</span>
        </h2>
        <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
          Built for serious students. Loved by toppers across 200+ campuses.
        </p>
      </section>

      {/* Plan selector */}
      <section className="space-y-3">
        {plans.map((p) => {
          const isActive = plan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={cn(
                "w-full text-left rounded-xl p-5 tap-scale transition-all relative overflow-hidden",
                isActive
                  ? "bg-card shadow-glow gradient-border"
                  : "surface-low shadow-soft"
              )}
            >
              {p.best && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-accent text-accent-foreground">
                  BEST VALUE
                </div>
              )}
              <div className="relative flex items-center gap-4">
                <div className={cn(
                  "h-6 w-6 rounded-full grid place-items-center shrink-0 transition-all",
                  isActive ? "gradient-primary shadow-glow" : "surface-high"
                )}>
                  {isActive && (
                    <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 14 }}>check</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-lg">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{p.sub} · {p.desc}</p>
                </div>
                <div className="text-right">
                  <div className="font-headline text-2xl font-black text-foreground">{p.price}</div>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Feature list */}
      <section className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Pro features</p>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full surface-low grid place-items-center shrink-0">
                <span className="material-symbols-outlined ms-fill text-primary" style={{ fontSize: 18 }}>{f.icon}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <Button
        onClick={() => toast("Payments coming soon — UI preview only", { icon: "✨" as any })}
        className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined ms-fill" style={{ fontSize: 22 }}>auto_awesome</span>
        {plan === "free" ? "Continue free" : "Start free trial"}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground font-medium">Auto-renews. Cancel anytime.</p>
    </main>
  );
}
