import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

const PLANS: Record<string, { amount: number; name: string }> = {
  monthly: { amount: 4900, name: "Attendify Pro Monthly" }, // ₹49
  yearly: { amount: 19900, name: "Attendify Pro Yearly" },  // ₹199
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan } = await req.json();
    const p = PLANS[plan];
    if (!p) {
      return new Response(JSON.stringify({ error: "invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: p.amount,
        currency: "INR",
        receipt: `att_${userData.user.id.slice(0, 8)}_${Date.now()}`,
        notes: { plan, user_id: userData.user.id },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error("razorpay order error", order);
      return new Response(JSON.stringify({ error: order.error?.description ?? "order failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: KEY_ID,
        planName: p.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
