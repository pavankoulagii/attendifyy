import { useMemo } from "react";
import { useAttendanceLogs, useSubjects } from "@/lib/data";
import { percent } from "@/lib/attendance";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, Line, LineChart, YAxis, CartesianGrid } from "recharts";
import { format, subDays, parseISO, startOfDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const { data: subjects = [] } = useSubjects();
  const { data: logs = [] } = useAttendanceLogs();

  const subjectData = subjects.map((s) => ({
    name: s.name.length > 8 ? s.name.slice(0, 8) + "…" : s.name,
    pct: Math.round(percent(s.classes_attended, s.classes_held)),
    color: s.color,
  }));

  const trendData = useMemo(() => {
    const days = 14;
    return Array.from({ length: days }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), days - 1 - i));
      const dayLogs = logs.filter((l) => isSameDay(parseISO(l.date), d));
      const present = dayLogs.filter((l) => l.status === "present").length;
      const counted = dayLogs.filter((l) => l.status !== "cancelled").length;
      return { day: format(d, "d MMM"), pct: counted ? Math.round((present / counted) * 100) : null };
    });
  }, [logs]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = startOfDay(subDays(new Date(), i));
      const dayLogs = logs.filter((l) => isSameDay(parseISO(l.date), d));
      if (dayLogs.length === 0) break;
      const allPresent = dayLogs.every((l) => l.status !== "absent");
      if (allPresent) s++; else break;
    }
    return s;
  }, [logs]);

  const best = [...subjects].sort((a, b) => percent(b.classes_attended, b.classes_held) - percent(a.classes_attended, a.classes_held))[0];
  const worst = [...subjects].sort((a, b) => percent(a.classes_attended, a.classes_held) - percent(b.classes_attended, b.classes_held))[0];

  return (
    <main className="px-5 pt-6 pb-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">Your attendance, visualized beautifully</p>
      </header>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-3">
        <Stat icon="local_fire_department" tone="accent" label="Current Streak" value={`${streak}d`} />
        <Stat icon="menu_book" tone="primary" label="Subjects" value={subjects.length} />
        <Stat icon="emoji_events" tone="secondary" label="Best" value={best ? best.name : "—"} small />
        <Stat icon="warning" tone="danger" label="Most missed" value={worst ? worst.name : "—"} small />
      </section>

      {/* Subject bar chart */}
      <section className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline font-bold text-lg">Subject Performance</h2>
          <span className="text-[11px] uppercase tracking-widest font-bold text-primary">% Attendance</span>
        </div>
        {subjectData.length === 0 ? <Empty /> : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4158D0" />
                    <stop offset="100%" stopColor="#C850C0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--surface-high))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "none", borderRadius: 16, boxShadow: "0px 8px 24px rgba(25,28,29,0.1)" }} />
                <Bar dataKey="pct" radius={[10, 10, 0, 0]}>
                  {subjectData.map((d, i) => <Cell key={i} fill="url(#bar-grad)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Trend line */}
      <section className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline font-bold text-lg">Last 14 Days</h2>
          <span className="text-[11px] uppercase tracking-widest font-bold text-primary">Trend</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4158D0" />
                  <stop offset="100%" stopColor="#C850C0" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--surface-high))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "none", borderRadius: 16, boxShadow: "0px 8px 24px rgba(25,28,29,0.1)" }} />
              <Line type="monotone" dataKey="pct" stroke="url(#line-grad)" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

function Stat({
  icon, label, value, tone, small,
}: {
  icon: string; label: string; value: any; tone: "primary" | "secondary" | "danger" | "accent"; small?: boolean;
}) {
  const isDanger = tone === "danger";
  return (
    <div className={cn(
      "rounded-xl p-5",
      isDanger ? "bg-destructive-container" : "surface-low"
    )}>
      <span className={cn(
        "material-symbols-outlined ms-fill block mb-3",
        tone === "primary" && "text-primary",
        tone === "secondary" && "text-secondary",
        tone === "danger" && "text-destructive-container-foreground",
        tone === "accent" && "text-accent",
      )} style={{ fontSize: 24 }}>{icon}</span>
      <p className={cn(
        "font-headline font-black",
        small ? "text-base truncate" : "text-2xl",
        isDanger && "text-destructive-container-foreground"
      )}>{value}</p>
      <p className={cn(
        "text-xs font-semibold mt-1",
        isDanger ? "text-destructive-container-foreground opacity-80" : "text-muted-foreground"
      )}>{label}</p>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground text-center py-6 font-medium">Add subjects to see stats.</p>;
}
