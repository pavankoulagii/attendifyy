import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/data";

export default function TopBar() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const nav = useNavigate();
  const initial = (profile?.display_name || user?.email || "A").trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 glass flex justify-between items-center px-5 py-3 mx-4 mt-3 rounded-2xl shadow-card">
      <button onClick={() => nav("/app/profile")} className="flex items-center gap-3 tap-scale">
        <div className="w-10 h-10 rounded-full gradient-primary text-white grid place-items-center font-headline font-bold text-sm shadow-soft">
          {initial}
        </div>
        <h1 className="font-headline font-extrabold text-xl text-primary tracking-tight">Attendify</h1>
      </button>
      <button
        onClick={() => nav("/app/profile")}
        className="w-10 h-10 grid place-items-center rounded-full surface-low text-primary tap-scale"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
      </button>
    </header>
  );
}
