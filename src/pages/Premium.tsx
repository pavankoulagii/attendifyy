import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const features = [
  { icon: "all_inclusive", text: "Unlimited subjects" },
  { icon: "block", text: "Zero ads, ever" },
  { icon: "auto_awesome", text: "Smart AI predictions" },
  { icon: "insights", text: "Detailed analytics & exports" },
  { icon: "palette", text: "Premium themes & widgets" },
  { icon: "cloud_sync", text: "Cloud backup & restore" },
  { icon: "picture_as_pdf", text: "PDF attendance export" },
  { icon: "support_agent", text: "Priority support" },
];

const plans = [
  { id: "yearly", name: "Pro Yearly", price: "₹149", amount: 149, sub: "per year · all features", desc: "Best value", best: true },
];

const trustBadges = [
  { icon: "verified_user", text: "Secure Payment" },
  { icon: "bolt", text: "Instant Activation" },
  { icon: "groups", text: "Trusted by Students" },
];

export default function Premium() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [plan, setPlan] = useState<"yearly">("yearly");
  const [loading, setLoading] = useState(false);

  const selectedPlan = plans.find((p) => p.id === plan)!;

  const startPayment = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      nav("/auth");
      return;
    }
    if (typeof window.Razorpay === "undefined") {
      toast.error("Payment system not ready. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: { plan },
      });
      if (error) throw error;
      if (!data?.orderId) throw new Error("Could not create order");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Attendify",
        description: data.planName,
        image: "/favicon.svg",
        prefill: {
          email: user.email ?? "",
          name: profile?.display_name ?? "",
        },
        theme: { color: "#2563eb" },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: async (response: any) => {
          try {
            const { error: vErr } = await supabase.functions.invoke("razorpay-verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              },
            });
            if (vErr) throw vErr;
            await qc.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Welcome to Attendify Pro! 🎉");
            nav("/app/profile");
          } catch (e: any) {
            toast.error(e.message ?? "Could not verify payment");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp.error?.description ?? "Payment failed");
        setLoading(false);
      });

      rzp.open();
    } catch (e: any) {
      toast.error(e.message ?? "Could not start payment");
      setLoading(false);
    }
  };

  return (
    <main className="px-5 pt-6 pb-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="h-11 w-11 rounded-full glass grid place-items-center text-primary tap-scale shadow-soft">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
        <h1 className="font-headline font-extrabold text-2xl tracking-tight">Attendify Pro</h1>
      </header>

      {/* Hero */}
      <section className="text-center space-y-3 py-4 relative">
        <div className="inline-grid h-20 w-20 rounded-[28px] gradient-hero shadow-glow place-items-center animate-float">
          <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 38 }}>workspace_premium</span>
        </div>
        <h2 className="font-headline font-extrabold text-4xl leading-tight tracking-tight">
          Unlock <span className="text-gradient">everything</span>
        </h2>
        <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
          Pay securely with UPI in seconds ⚡
        </p>
      </section>

      {/* Trust badges */}
      <section className="grid grid-cols-3 gap-2">
        {trustBadges.map((b) => (
          <div key={b.text} className="surface-low rounded-xl p-3 flex flex-col items-center gap-1 text-center">
            <span className="material-symbols-outlined ms-fill text-primary" style={{ fontSize: 20 }}>{b.icon}</span>
            <p className="text-[10px] font-bold text-foreground leading-tight">{b.text}</p>
          </div>
        ))}
      </section>

      {/* Plan selector */}
      <section className="space-y-3">
        {plans.map((p) => {
          const isActive = plan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlan("yearly")}
              className={cn(
                "w-full text-left rounded-xl p-5 tap-scale transition-all relative overflow-hidden",
                isActive ? "bg-card shadow-glow gradient-border" : "surface-low shadow-soft",
              )}
            >
              {p.best && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-accent text-accent-foreground">
                  BEST VALUE
                </div>
              )}
              <div className="relative flex items-center gap-4">
                <div className={cn(
                  "h-6 w-6 rounded-full grid place-items-center shrink-0 transition-all",
                  isActive ? "gradient-primary shadow-glow" : "surface-high",
                )}>
                  {isActive && (
                    <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 14 }}>check</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-lg">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{p.sub} · {p.desc}</p>
                </div>
                <div className="text-right">
                  <div className="font-headline text-2xl font-black text-foreground">{p.price}</div>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Feature list */}
      <section className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Pro features</p>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full surface-low grid place-items-center shrink-0">
                <span className="material-symbols-outlined ms-fill text-primary" style={{ fontSize: 18 }}>{f.icon}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <Button
        onClick={startPayment}
        disabled={loading}
        className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 22 }}>progress_activity</span>
            Opening checkout…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined ms-fill" style={{ fontSize: 22 }}>bolt</span>
            Continue with UPI · {selectedPlan.price}
          </>
        )}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
        Secured by Razorpay · UPI · Cards · Netbanking · Wallets
      </p>
    </main>
  );
}
