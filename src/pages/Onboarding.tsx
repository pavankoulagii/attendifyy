import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    icon: TrendingUp,
    title: "Track attendance,\ninstantly.",
    sub: "One tap to mark Present, Absent, or Cancelled. Live percentages, zero math.",
    grad: "from-violet-500 via-fuchsia-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Know how many\nclasses you can bunk.",
    sub: "Real-time safe-bunk count per subject so you never gamble with 75%.",
    grad: "from-cyan-400 via-blue-500 to-indigo-500",
  },
  {
    icon: ShieldCheck,
    title: "Never get detained\nagain.",
    sub: "Smart alerts the moment you slip below safe. Stay above 75% effortlessly.",
    grad: "from-emerald-400 via-teal-500 to-cyan-500",
  },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const last = i === slides.length - 1;
  const S = slides[i];
  const Icon = S.icon;

  const next = () => (last ? nav("/auth") : setI(i + 1));

  return (
    <div className="min-h-screen mx-auto max-w-md px-6 py-10 flex flex-col">
      <div className="flex justify-end">
        <button onClick={() => nav("/auth")} className="text-sm text-muted-foreground hover:text-foreground tap-scale">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-8 animate-slide-up" key={i}>
        <div className={cn("h-44 w-44 rounded-[2.5rem] grid place-items-center bg-gradient-to-br shadow-glow animate-float", S.grad)}>
          <Icon className="h-20 w-20 text-white" strokeWidth={1.6} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-display font-bold whitespace-pre-line leading-tight">{S.title}</h1>
          <p className="text-muted-foreground px-2">{S.sub}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {slides.map((_, k) => (
          <span
            key={k}
            className={cn(
              "h-1.5 rounded-full transition-all",
              k === i ? "w-8 bg-primary" : "w-1.5 bg-muted"
            )}
          />
        ))}
      </div>

      <Button onClick={next} size="lg" className="w-full h-14 rounded-2xl text-base font-semibold gradient-primary shadow-glow tap-scale border-0">
        {last ? "Get Started" : "Next"} <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
