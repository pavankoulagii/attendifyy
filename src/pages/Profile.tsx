import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";
import { Crown, LogOut, Moon, Sun, Sparkles } from "lucide-react";
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

  return (
    <div className="px-5 pt-8 space-y-5 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <button onClick={toggle} className="h-10 w-10 rounded-2xl glass grid place-items-center tap-scale">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <GlassCard className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl gradient-primary grid place-items-center text-2xl font-bold text-primary-foreground shadow-glow">
          {(name || user?.email || "?").slice(0,1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-lg truncate">{name || "Student"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email ?? "Guest mode"}</p>
          {profile?.is_premium && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-semibold">
              <Crown className="h-3 w-3" /> PRO
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="space-y-3">
        <Field label="Name"><Input value={name} onChange={(e)=>setName(e.target.value)} className="h-11 rounded-xl" /></Field>
        <Field label="College"><Input value={college} onChange={(e)=>setCollege(e.target.value)} placeholder="VTU / IIT / …" className="h-11 rounded-xl" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course"><Input value={course} onChange={(e)=>setCourse(e.target.value)} placeholder="B.E. CSE" className="h-11 rounded-xl" /></Field>
          <Field label="Semester"><Input value={semester} onChange={(e)=>setSemester(e.target.value)} placeholder="5" className="h-11 rounded-xl" /></Field>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs">Default required attendance</Label>
            <span className="text-sm font-display font-bold text-gradient">{required}%</span>
          </div>
          <Slider value={[required]} onValueChange={(v) => setRequired(v[0])} min={50} max={95} step={5} />
        </div>
        <Button onClick={save} className="w-full rounded-xl gradient-primary border-0 h-12">Save changes</Button>
      </GlassCard>

      <GlassCard onClick={() => nav("/app/premium")} className="cursor-pointer flex items-center gap-3 active:scale-[0.99] transition-transform">
        <div className="h-12 w-12 rounded-2xl gradient-warning grid place-items-center shadow-glow">
          <Crown className="h-6 w-6 text-warning-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold">Attendify Pro</p>
          <p className="text-xs text-muted-foreground">Unlimited subjects, AI predictions, no ads</p>
        </div>
        <Sparkles className="h-4 w-4 text-warning" />
      </GlassCard>

      <Button onClick={() => { signOut(); nav("/auth"); }} variant="outline" className="w-full rounded-xl h-12 text-destructive border-destructive/30">
        <LogOut className="h-4 w-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
