import { NextResponse } from "next/server";
import Stripe from "stripe";

// Conectamos con tu llave secreta de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const { email, tipo } = await req.json();

    let line_items: any[] = [];
    let mode: "payment" | "subscription" = "payment";

    // 🛒 OPCIÓN 1: Compra por impulso (1 Reporte)
    if (tipo === "credito") {
      line_items = [{
        price_data: {
          currency: "usd",
          product_data: { name: "1 Reporte de Auditoría (MorAds)" },
          unit_amount: 500, // $5.00 USD
        },
        quantity: 1,
      }];
    } 
    // 🏢 OPCIÓN 2: Suscripción Agencia (Pro)
    else if (tipo === "pro") {
      line_items = [{
        price_data: {
          currency: "usd",
          product_data: { name: "Suscripción Pro - Agencias" },
          unit_amount: 2900, // $29.00 USD
          recurring: { interval: "month" }, // Cobro mensual
        },
        quantity: 1,
      }];
      mode = "subscription";
    }

    // Creamos la sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode,
      customer_email: email,
      success_url: "https://morads-3wm7.vercel.app/?success=true",
      cancel_url: "https://morads-3wm7.vercel.app/?canceled=true",
    });

    // Le devolvemos a tu web el link seguro de pago
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Error en Stripe:", error);
    return NextResponse.json({ error: "Error creando el pago" }, { status: 500 });
  }
}