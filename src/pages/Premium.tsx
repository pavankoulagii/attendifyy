import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import upiQr from "@/assets/upi-qr.jpg";

// Strict UTR validator: 12 digits, not all-same, not trivial sequence
function isValidUtr(s: string): boolean {
  if (!/^\d{12}$/.test(s)) return false;
  if (/^(\d)\1{11}$/.test(s)) return false; // 000000000000, 111111111111, ...
  if (s === "123456789012" || s === "012345678901") return false;
  return true;
}

const UPI_ID = "attendify@ybl";
const UPI_NAME = "Attendify";

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
  { id: "free", name: "Free", price: "₹0", amount: 0, sub: "Forever", desc: "5 subjects only" },
  { id: "monthly", name: "Pro Monthly", price: "₹49", amount: 49, sub: "per month", desc: "Cancel anytime" },
  { id: "yearly", name: "Pro Yearly", price: "₹149", amount: 149, sub: "per year · save 75%", desc: "Best value", best: true },
];

type PayStage = "idle" | "scan" | "txn" | "processing" | "success";

export default function Premium() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState("yearly");
  const [stage, setStage] = useState<PayStage>("idle");
  const [txnId, setTxnId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const updateProfile = useUpdateProfile();

  const selectedPlan = plans.find((p) => p.id === plan)!;
  const amount = selectedPlan.price;

  const startPayment = () => {
    if (plan === "free") {
      nav("/app");
      return;
    }
    setTxnId("");
    setProofFile(null);
    setStage("scan");
  };

  const submitTxn = async () => {
    const trimmed = txnId.trim();
    if (!isValidUtr(trimmed)) {
      toast.error("UTR must be exactly 12 digits (check your UPI app)");
      return;
    }
    if (!proofFile) {
      toast.error("Please upload a screenshot of the payment success");
      return;
    }
    if (!proofFile.type.startsWith("image/")) {
      toast.error("Screenshot must be an image (PNG/JPG)");
      return;
    }
    if (proofFile.size > 5 * 1024 * 1024) {
      toast.error("Screenshot must be under 5 MB");
      return;
    }
    if (!user) {
      toast.error("Please sign in again");
      return;
    }

    setStage("processing");
    try {
      // 1) Reject if this txn ID was already used by anyone
      const { data: existing, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("upi_txn_id", trimmed)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) {
        toast.error("This transaction ID has already been used.");
        setStage("txn");
        return;
      }

      // 2) Upload screenshot to private bucket under user's folder
      const ext = (proofFile.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${trimmed}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proofFile, { contentType: proofFile.type, upsert: false });
      if (upErr) throw upErr;

      // 3) Activate Pro
      await updateProfile.mutateAsync({
        is_premium: true,
        upi_txn_id: trimmed,
        premium_plan: plan,
        premium_paid_at: new Date().toISOString(),
        payment_proof_path: path,
      } as any);
      setStage("success");
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("profiles_upi_txn_id_unique") || msg.toLowerCase().includes("duplicate")) {
        toast.error("This transaction ID has already been used.");
      } else {
        toast.error(msg || "Could not confirm payment");
      }
      setStage("txn");
    }
  };

  if (stage !== "idle") {
    return (
      <PaymentFlow
        stage={stage}
        amount={amount}
        planName={selectedPlan.name}
        txnId={txnId}
        setTxnId={setTxnId}
        proofFile={proofFile}
        setProofFile={setProofFile}
        onProceedToTxn={() => setStage("txn")}
        onSubmitTxn={submitTxn}
        onBack={() => setStage(stage === "txn" ? "scan" : "idle")}
        onClose={() => setStage("idle")}
        onDone={() => nav("/app/profile")}
      />
    );
  }

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
          Built for serious students. Loved by toppers across 200+ campuses.
        </p>
      </section>

      {/* Plan selector */}
      <section className="space-y-3">
        {plans.map((p) => {
          const isActive = plan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={cn(
                "w-full text-left rounded-xl p-5 tap-scale transition-all relative overflow-hidden",
                isActive
                  ? "bg-card shadow-glow gradient-border"
                  : "surface-low shadow-soft"
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
                  isActive ? "gradient-primary shadow-glow" : "surface-high"
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
        className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined ms-fill" style={{ fontSize: 22 }}>
          {plan === "free" ? "auto_awesome" : "qr_code_scanner"}
        </span>
        {plan === "free" ? "Continue free" : `Pay ${amount} via UPI`}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground font-medium">Secure UPI payment · Cancel anytime</p>
    </main>
  );
}

function PaymentFlow({
  stage,
  amount,
  planName,
  txnId,
  setTxnId,
  onProceedToTxn,
  onSubmitTxn,
  onBack,
  onClose,
  onDone,
}: {
  stage: PayStage;
  amount: string;
  planName: string;
  txnId: string;
  setTxnId: (v: string) => void;
  onProceedToTxn: () => void;
  onSubmitTxn: () => void;
  onBack: () => void;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <main className="min-h-[100dvh] px-5 pt-6 pb-12 flex flex-col animate-fade-in overflow-y-auto">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        {(stage === "scan" || stage === "txn") && (
          <button onClick={stage === "txn" ? onBack : onClose} className="h-11 w-11 rounded-full glass grid place-items-center text-primary tap-scale shadow-soft">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
        )}
        <div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-primary">{planName}</p>
          <h1 className="font-headline font-extrabold text-xl tracking-tight">
            {stage === "scan" && "Scan to pay"}
            {stage === "txn" && "Enter transaction ID"}
            {stage === "processing" && "Verifying…"}
            {stage === "success" && "Payment successful"}
          </h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {stage === "scan" && (
          <>
            <div className="bg-card rounded-3xl p-4 shadow-card w-full max-w-xs space-y-3">
              <div className="rounded-2xl bg-white relative overflow-hidden aspect-square">
                <img
                  src={upiQr}
                  alt="UPI QR code"
                  className="absolute inset-0 w-full h-full block"
                  style={{ objectFit: "cover", objectPosition: "center 47%", transform: "scale(2.1)", transformOrigin: "center 47%" }}
                />
                <div className="absolute inset-x-4 h-1 rounded-full bg-primary/70 shadow-glow animate-scan-line pointer-events-none z-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Pay to</p>
                <p className="font-headline font-bold text-base">{UPI_NAME}</p>
                <p className="text-xs text-muted-foreground font-medium font-mono">{UPI_ID}</p>
                <p className="font-headline font-black text-3xl mt-2 text-gradient">{amount}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock</span>
                Secured by Lovable Pay
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium text-center max-w-xs">
              Open any UPI app · GPay, PhonePe, Paytm · Scan the code to complete payment
            </p>
            <Button
              onClick={onProceedToTxn}
              className="w-full max-w-xs h-14 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined ms-fill" style={{ fontSize: 20 }}>check_circle</span>
              I've paid · Enter txn ID
            </Button>
          </>
        )}

        {stage === "txn" && (
          <div className="w-full max-w-xs space-y-5">
            <div className="bg-card rounded-3xl p-6 shadow-card space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-grid h-14 w-14 rounded-2xl gradient-primary shadow-glow place-items-center mx-auto">
                  <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 28 }}>receipt_long</span>
                </div>
                <p className="font-headline font-bold text-lg pt-2">Confirm your payment</p>
                <p className="text-xs text-muted-foreground font-medium">
                  Paste the 12-digit UTR / transaction ID from your UPI app
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value.replace(/\s+/g, ""))}
                  placeholder="e.g. 412345678901"
                  inputMode="text"
                  autoFocus
                  maxLength={30}
                  className="h-12 text-center font-mono tracking-wider text-base"
                />
                <p className="text-[11px] text-muted-foreground font-medium text-center">
                  Find it under "Transaction details" in PhonePe / GPay / Paytm
                </p>
              </div>
              <div className="flex items-center justify-between text-xs surface-low rounded-xl px-3 py-2">
                <span className="text-muted-foreground font-medium">Amount paid</span>
                <span className="font-headline font-bold">{amount}</span>
              </div>
            </div>
            <Button
              onClick={onSubmitTxn}
              className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined ms-fill" style={{ fontSize: 20 }}>verified</span>
              Verify & activate Pro
            </Button>
          </div>
        )}

        {stage === "processing" && (
          <div className="flex flex-col items-center gap-5">
            <div className="h-24 w-24 rounded-full gradient-primary shadow-glow grid place-items-center animate-pulse">
              <span className="material-symbols-outlined ms-fill text-white animate-spin" style={{ fontSize: 44, animationDuration: "1.4s" }}>
                progress_activity
              </span>
            </div>
            <div className="text-center space-y-1">
              <p className="font-headline font-bold text-lg">Verifying payment</p>
              <p className="text-xs text-muted-foreground font-medium">Please don't close this screen…</p>
            </div>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center gap-5 animate-fade-in">
            <div className="h-28 w-28 rounded-full bg-emerald-500/15 grid place-items-center">
              <div className="h-20 w-20 rounded-full bg-emerald-500 grid place-items-center shadow-glow">
                <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 48 }}>check</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-headline font-extrabold text-2xl">Welcome to Pro 🎉</p>
              <p className="text-sm text-muted-foreground font-medium">Paid {amount} · {planName}</p>
              {txnId && (
                <p className="text-[11px] text-muted-foreground font-mono pt-1">Txn: {txnId}</p>
              )}
            </div>
            <Button
              onClick={onDone}
              className="h-12 px-8 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale"
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
