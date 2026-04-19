import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", icon: "home", label: "Home", end: true },
  { to: "/app/subjects", icon: "book", label: "Subjects" },
  { to: "/app/timetable", icon: "calendar_month", label: "Calendar" },
  { to: "/app/analytics", icon: "leaderboard", label: "Analytics" },
  { to: "/app/profile", icon: "person", label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom pointer-events-none">
      <div className="mx-auto max-w-md px-4 pb-3 pt-1">
        <div className="glass-strong rounded-[28px] flex justify-around items-center px-2 py-2 pointer-events-auto">
          {items.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end as any}
              className="flex-1 flex justify-center"
            >
              {({ isActive }) => (
                <div
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-full tap-scale transition-all",
                    isActive
                      ? "gradient-primary text-white shadow-glow"
                      : "text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <span className={cn("material-symbols-outlined", isActive && "ms-fill")} style={{ fontSize: 22 }}>
                    {icon}
                  </span>
                  <span className="font-headline text-[10px] font-semibold mt-0.5">{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
