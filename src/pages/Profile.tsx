import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [required, setRequired] = useState(75);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setCollege(profile.college ?? "");
      setCourse(profile.course ?? "");
      setSemester(profile.semester ?? "");
      setRequired(Number(profile.required_attendance ?? 75));
    }
  }, [profile]);

  const save = async () => {
    try {
      await update.mutateAsync({
        display_name: name, college, course, semester, required_attendance: required,
      });
      toast.success("Saved ✨");
    } catch (e: any) { toast.error(e.message); }
  };

  const initial = (name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <main className="px-5 pt-6 pb-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-headline font-extrabold text-3xl tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage your account & preferences</p>
        </div>
        <button
          onClick={toggle}
          className="h-11 w-11 rounded-full glass grid place-items-center text-primary tap-scale shadow-soft"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </header>

      {/* Identity card — gradient hero */}
      <section className="glass gradient-border rounded-xl p-6 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute -top-16 -right-12 w-44 h-44 gradient-primary opacity-10 rounded-full blur-3xl" />
        <div className="relative h-20 w-20 rounded-full gradient-primary grid place-items-center text-3xl font-headline font-black text-white shadow-glow shrink-0">
          {initial}
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="font-headline font-bold text-xl truncate">{name || "Student"}</p>
          <p className="text-xs text-muted-foreground truncate font-medium">{user?.email ?? "Guest mode"}</p>
          {profile?.is_premium ? (
            <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-[10px] font-bold tracking-wide">
              <span className="material-symbols-outlined ms-fill" style={{ fontSize: 12 }}>workspace_premium</span>
              ATTENDIFY PRO
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-secondary-container text-secondary-container-foreground text-[10px] font-bold tracking-wide">
              <span className="material-symbols-outlined ms-fill" style={{ fontSize: 12 }}>verified</span>
              FREE PLAN
            </div>
          )}
        </div>
      </section>

      {/* Account details */}
      <section className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Account Details</p>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl border-0 surface-low" />
        </Field>
        <Field label="College">
          <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="VTU / IIT / …" className="h-12 rounded-2xl border-0 surface-low" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course">
            <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="B.E. CSE" className="h-12 rounded-2xl border-0 surface-low" />
          </Field>
          <Field label="Semester">
            <Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="5" className="h-12 rounded-2xl border-0 surface-low" />
          </Field>
        </div>

        {/* Slider */}
        <div className="surface-low rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
              Default required attendance
            </Label>
            <span className="text-2xl font-headline font-black text-gradient">{required}%</span>
          </div>
          <Slider value={[required]} onValueChange={(v) => setRequired(v[0])} min={50} max={95} step={5} />
        </div>

        <Button onClick={save} className="w-full rounded-2xl gradient-primary border-0 h-12 font-headline font-bold shadow-glow tap-scale">
          <span className="material-symbols-outlined mr-2" style={{ fontSize: 20 }}>check_circle</span>
          Save changes
        </Button>
      </section>

      {/* Pro upsell */}
      <button
        onClick={() => nav("/app/premium")}
        className="w-full bg-card rounded-xl p-5 flex items-center gap-4 shadow-card tap-scale text-left"
      >
        <div className="h-14 w-14 rounded-2xl gradient-hero grid place-items-center shadow-glow shrink-0">
          <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 28 }}>workspace_premium</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-lg">Attendify Pro</p>
          <p className="text-xs text-muted-foreground font-medium">Unlimited subjects, AI predictions, no ads</p>
        </div>
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>arrow_forward_ios</span>
      </button>

      {/* Sign out */}
      <Button
        onClick={() => { signOut(); nav("/auth"); }}
        variant="ghost"
        className="w-full rounded-2xl h-12 bg-destructive-container text-destructive-container-foreground border-0 font-headline font-bold tap-scale"
      >
        <span className="material-symbols-outlined mr-2" style={{ fontSize: 20 }}>logout</span>
        Sign out
      </Button>
    </main>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
