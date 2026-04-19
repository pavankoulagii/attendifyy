import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowRight, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Attendify ✨");
        nav("/app");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back 👋");
        nav("/app");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) toast.error(error.message);
  };

  const guest = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Continuing as guest");
    nav("/app");
  };

  return (
    <div className="min-h-screen mx-auto max-w-md px-6 py-10 flex flex-col">
      <div className="text-center mb-8 animate-slide-up">
        <div className="inline-block h-16 w-16 rounded-2xl gradient-primary shadow-glow grid place-items-center mb-4">
          <span className="text-2xl font-display font-bold text-primary-foreground">A</span>
        </div>
        <h1 className="text-3xl font-display font-bold">Attendify</h1>
        <p className="text-muted-foreground mt-1">Never get detained again.</p>
      </div>

      <div className="glass rounded-3xl p-5 space-y-4 animate-slide-up">
        <div className="grid grid-cols-2 bg-muted/60 rounded-2xl p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "py-2 rounded-xl text-sm font-semibold transition-all",
                mode === m ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              )}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pavan" required className="h-12 rounded-xl" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" required className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required className="h-12 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary border-0 shadow-glow font-semibold tap-scale">
            <Mail className="h-4 w-4 mr-2" />
            {mode === "signin" ? "Sign in with Email" : "Create account"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="px-2 text-[11px] text-muted-foreground bg-card rounded">or</span></div>
        </div>

        <Button onClick={google} variant="outline" className="w-full h-12 rounded-xl tap-scale">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continue with Google
        </Button>

        <Button onClick={guest} variant="ghost" disabled={loading} className="w-full h-12 rounded-xl tap-scale">
          <UserCircle2 className="h-4 w-4 mr-2" /> Continue as Guest
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-6 px-6">
        By continuing you agree to Attendify's Terms & Privacy.
      </p>
    </div>
  );
}
