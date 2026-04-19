import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    eyebrow: "Track",
    titleA: "Track attendance",
    titleB: "beautifully",
    sub: "Experience a premium interface designed for the focused student. Effortless tracking, zero clutter.",
    icon: "edit_calendar",
    cardBg: "surface-bright",
  },
  {
    eyebrow: "Plan",
    titleA: "Know how many",
    titleB: "classes you can miss",
    sub: "Our smart algorithm tells you exactly where you stand. Plan your breaks with confidence.",
    icon: "event_busy",
    cardBg: "surface-low",
  },
  {
    eyebrow: "Win",
    titleA: "Stay above 75%",
    titleB: "stress-free",
    sub: "Get timely reminders and smart predictions so you never fall below the limit.",
    icon: "rocket_launch",
    cardBg: "surface-bright",
  },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const last = i === slides.length - 1;
  const S = slides[i];

  const next = () => (last ? nav("/auth") : setI(i + 1));

  return (
    <div className={cn("min-h-screen mx-auto max-w-md flex flex-col relative pt-12 pb-10", S.cardBg)}>
      <div className="absolute top-6 right-6">
        <button onClick={() => nav("/auth")} className="text-muted-foreground font-semibold text-sm tap-scale">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center editorial animate-slide-up" key={i}>
        {/* Hero visual card */}
        {i === 2 ? (
          <div className="relative w-64 h-64 mx-auto mb-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
              <circle cx="128" cy="128" fill="transparent" r="110" stroke="hsl(var(--surface-high))" strokeWidth="14" />
              <circle cx="128" cy="128" fill="transparent" r="110" stroke="url(#onb-grad)" strokeDasharray="691" strokeDashoffset="172" strokeLinecap="round" strokeWidth="14" />
              <defs>
                <linearGradient id="onb-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#4158D0" />
                  <stop offset="100%" stopColor="#C850C0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-headline font-black text-6xl text-foreground">75%</span>
              <span className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Target</span>
            </div>
          </div>
        ) : (
          <div className="relative mb-12">
            <div className="w-full aspect-[4/5] max-h-80 rounded-xl overflow-hidden bg-card shadow-card relative grid place-items-center">
              <div className="absolute inset-0 gradient-hero opacity-10" />
              <div className="relative z-10 grid place-items-center">
                <div className="w-32 h-32 rounded-full bg-card/80 backdrop-blur grid place-items-center shadow-glow">
                  <span className="material-symbols-outlined ms-fill text-primary" style={{ fontSize: 64 }}>{S.icon}</span>
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 p-4 bg-card/70 backdrop-blur-xl rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary text-white grid place-items-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Today's Status</p>
                  <p className="text-sm font-bold text-foreground">Physics • 09:00 AM</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-4 w-24 h-24 gradient-primary opacity-10 rounded-full blur-3xl" />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="font-headline font-black text-4xl leading-tight tracking-tight text-foreground">
            {S.titleA} <br />
            <span className="text-gradient">{S.titleB}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xs leading-relaxed">{S.sub}</p>
        </div>
      </div>

      <div className="px-8 flex items-center justify-between mt-8">
        <div className="flex gap-2 items-center">
          {slides.map((_, k) => (
            <div
              key={k}
              className={cn(
                "h-1.5 rounded-full transition-all",
                k === i ? "w-8 bg-primary" : "w-2 bg-border"
              )}
            />
          ))}
        </div>
        <Button onClick={next} className="gradient-primary text-white px-8 py-4 h-auto rounded-xl font-headline font-bold shadow-glow flex items-center gap-2 tap-scale border-0">
          {last ? "Get Started" : "Continue"}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{last ? "rocket_launch" : "arrow_forward"}</span>
        </Button>
      </div>
    </div>
  );
}
