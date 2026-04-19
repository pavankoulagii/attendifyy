import { NavLink } from "react-router-dom";
import { Home, BookOpen, Calendar, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", icon: Home, label: "Home", end: true },
  { to: "/app/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/app/timetable", icon: Calendar, label: "Timetable" },
  { to: "/app/analytics", icon: BarChart3, label: "Stats" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 safe-bottom">
      <div className="mx-auto max-w-md px-3 pb-2 pt-1">
        <div className="glass-strong rounded-3xl flex items-center justify-around py-2 px-1 shadow-card">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end as any}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl tap-scale transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn("p-1 rounded-xl transition-all", isActive && "gradient-primary shadow-glow")}>
                    <Icon className={cn("h-5 w-5", isActive && "text-primary-foreground")} />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
