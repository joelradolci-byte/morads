import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const email = session.customer_email;
    const esSuscripcion = session.mode === "subscription";

    if (esSuscripcion) {
      await supabase.from('suscripciones').upsert({ email: email, plan: 'pro' });
    } else {
      const { data: perfil } = await supabase.from('suscripciones').select('creditos_extra').eq('email', email).single();
      const nuevosCreditos = (perfil?.creditos_extra || 0) + 1;
      await supabase.from('suscripciones').upsert({ email: email, creditos_extra: nuevosCreditos });
    }
  }
  return NextResponse.json({ received: true });
}