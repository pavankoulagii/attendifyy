import { useMemo } from "react";
import { useAttendanceLogs, useSubjects } from "@/lib/data";
import { percent } from "@/lib/attendance";
import { GlassCard } from "@/components/GlassCard";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, Line, LineChart, YAxis, CartesianGrid } from "recharts";
import { format, subDays, parseISO, startOfDay, isSameDay } from "date-fns";
import { Trophy, Flame, TrendingUp, AlertTriangle } from "lucide-react";

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

  const best = [...subjects].sort((a,b)=>percent(b.classes_attended,b.classes_held)-percent(a.classes_attended,a.classes_held))[0];
  const worst = [...subjects].sort((a,b)=>percent(a.classes_attended,a.classes_held)-percent(b.classes_attended,b.classes_held))[0];

  return (
    <div className="px-5 pt-8 space-y-5 animate-fade-in">
      <header>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="text-xs text-muted-foreground">Your attendance, visualized</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Flame} label="Streak" value={`${streak}d`} grad="gradient-warning" />
        <Stat icon={TrendingUp} label="Subjects" value={subjects.length} grad="gradient-primary" />
        <Stat icon={Trophy} label="Best" value={best ? best.name : "—"} grad="gradient-success" small />
        <Stat icon={AlertTriangle} label="Most missed" value={worst ? worst.name : "—"} grad="gradient-danger" small />
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Subject-wise %</h2>
        </div>
        {subjectData.length === 0 ? <Empty /> : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0,100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="pct" radius={[8,8,0,0]}>
                  {subjectData.map((d,i)=><Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="font-display font-semibold mb-3">Last 14 days</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0,100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="pct" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

function Stat({ icon: Icon, label, value, grad, small }: any) {
  return (
    <GlassCard className="py-4">
      <div className={`h-9 w-9 rounded-xl grid place-items-center mb-2 ${grad}`}>
        <Icon className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className={small ? "text-base font-display font-bold truncate" : "text-2xl font-display font-bold"}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </GlassCard>
  );
}
function Empty() { return <p className="text-sm text-muted-foreground text-center py-6">Add subjects to see stats.</p>; }
