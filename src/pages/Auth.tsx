import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Catch OAuth provider errors returned in the URL (e.g. ?error=... or #error=...)
  useEffect(() => {
    const parse = (s: string) => new URLSearchParams(s.startsWith("#") ? s.slice(1) : s);
    const fromHash = parse(window.location.hash || "");
    const fromQuery = parse(window.location.search || "");
    const err =
      fromHash.get("error_description") ||
      fromHash.get("error") ||
      fromQuery.get("error_description") ||
      fromQuery.get("error");
    if (err) {
      toast.error(`Google sign-in failed: ${decodeURIComponent(err).replace(/\+/g, " ")}`);
      // Clean URL so the error doesn't persist on refresh
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
    try {
      setGoogleLoading(true);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (result.error) {
        throw result.error;
      }
      if (result.redirected) {
        // Browser will redirect to Google
        return;
      }
      // Tokens received and session set — user is authenticated
      toast.success("Welcome 👋");
      nav("/app");
    } catch (err: any) {
      const msg = err?.message ?? "Google sign-in failed";
      toast.error(`${msg}. Please try again or use email sign-in.`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen mx-auto max-w-md px-6 py-10 flex flex-col surface-bright relative overflow-hidden">
      <div className="absolute -top-32 -right-24 w-72 h-72 gradient-primary opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-72 h-72 gradient-hero opacity-15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center mb-8 animate-slide-up">
        <div className="inline-grid place-items-center h-20 w-20 rounded-[28px] gradient-primary shadow-glow mb-5">
          <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 38 }}>
            school
          </span>
        </div>
        <h1 className="font-headline font-extrabold text-4xl tracking-tight text-foreground">Attendify</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Never get detained again.</p>
      </div>

      <div className="relative glass rounded-[28px] p-6 space-y-5 animate-slide-up shadow-card">
        <div className="grid grid-cols-2 surface-low rounded-full p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "py-2.5 rounded-full text-sm font-headline font-bold tap-scale transition-all",
                mode === m
                  ? "gradient-primary text-white shadow-soft"
                  : "text-muted-foreground"
              )}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {forgotOpen ? (
          <form onSubmit={sendReset} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Reset email
              </Label>
              <Input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@college.edu"
                required
                className="h-12 rounded-2xl border-0 surface-low focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground pt-1">
                We'll email you a link to set a new password.
              </p>
            </div>
            <Button
              type="submit"
              disabled={forgotLoading}
              className="w-full h-12 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale"
            >
              {forgotLoading ? "Sending…" : "Send reset link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setForgotOpen(false)}
              className="w-full h-10 rounded-2xl font-headline font-bold"
            >
              Back to sign in
            </Button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="h-12 rounded-2xl border-0 surface-low focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                required
                className="h-12 rounded-2xl border-0 surface-low focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotOpen(true);
                    }}
                    className="text-[11px] font-bold uppercase tracking-widest text-primary tap-scale"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  className="h-12 pr-12 rounded-2xl border-0 surface-low focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground tap-scale"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 py-4 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mail</span>
              {mode === "signin" ? "Sign in with Email" : "Create account"}
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            </Button>
          </form>
        )}

        {!forgotOpen && (
          <>
            <div className="flex items-center justify-center">
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">or</span>
            </div>

            <Button
              type="button"
              onClick={google}
              disabled={googleLoading}
              variant="ghost"
              className="w-full h-12 rounded-2xl bg-card hover:bg-surface-low text-foreground tap-scale font-headline font-bold shadow-soft border-0"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              {googleLoading ? "Connecting to Google…" : "Continue with Google"}
            </Button>
          </>
        )}
      </div>

      <p className="relative text-center text-[11px] text-muted-foreground mt-6 px-6 font-medium">
        By continuing you agree to Attendify's <span className="text-primary font-semibold">Terms</span> & <span className="text-primary font-semibold">Privacy</span>.
      </p>
    </div>
  );
}
