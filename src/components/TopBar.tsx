import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/data";
import logo from "@/assets/attendify-logo.png";

export default function TopBar() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const nav = useNavigate();
  const initial = (profile?.display_name || user?.email || "A").trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 glass flex justify-between items-center px-5 py-3 mx-4 mt-3 rounded-2xl shadow-card">
      <button onClick={() => nav("/app/profile")} className="flex items-center gap-2 tap-scale">
        <img src={logo} alt="Attendify logo" className="w-10 h-10 object-contain" />
        <h1 className="font-headline font-extrabold text-xl text-primary tracking-tight">Attendify</h1>
      </button>
      <button
        onClick={() => nav("/app/profile")}
        className="w-10 h-10 grid place-items-center rounded-full surface-low text-primary tap-scale"
        aria-label="Profile"
      >
        <div className="w-9 h-9 rounded-full gradient-primary text-white grid place-items-center font-headline font-bold text-sm shadow-soft">
          {initial}
        </div>
      </button>
    </header>
  );
}
