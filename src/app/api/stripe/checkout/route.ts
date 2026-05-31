import { NextResponse } from "next/server";

import { getUserFromAuthHeader } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";

// Stripe Checkout session creator. Frontend POSTs here with a
// Bearer token; we mint a Checkout session for the signed-in user
// with metadata that the verify-session endpoint will read after
// the user pays.

export const runtime = "nodejs";

export async function POST(request: Request) {
 const user = await getUserFromAuthHeader(request);
 if (!user) {
 return NextResponse.json(
 { error: "Sign in required to start checkout." },
 { status: 401 },
 );
 }

 const priceId = process.env.STRIPE_BOOST_PRICE_ID;
 if (!priceId) {
 return NextResponse.json(
 {
 error:
 "STRIPE_BOOST_PRICE_ID is not configured. Set it in .env.local + restart dev.",
 },
 { status: 500 },
 );
 }

 // App URL drives where Stripe redirects after success / cancel.
 // Defaults to localhost for dev; on Vercel this is set to
 // https://polln8.com via the env var dashboard.
 const appUrl =
 process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

 // Boost target_role is the OPPOSITE of the buyer's own role: a
 // founder pays to show up in the partner deck and vice versa.
 // Defaults to partner if user_metadata.role isn't set (legacy
 // accounts).
 const role =
 user.user_metadata?.role === "founder" ? "founder" : "partner";
 const targetRole = role === "founder" ? "partner" : "founder";

 try {
 const session = await getStripe().checkout.sessions.create({
 mode: "payment",
 line_items: [{ price: priceId, quantity: 1 }],
 success_url: `${appUrl}/boost?session_id={CHECKOUT_SESSION_ID}`,
 cancel_url: `${appUrl}/boost`,
 customer_email: user.email ?? undefined,
 // Card-only for v1 - async payment methods (ACH, bank debits,
 // Klarna) settle hours-to-days later and would need a webhook
 // to grant the boost. Keeping payment_method_types at "card"
 // means payment_status flips to "paid" immediately on the
 // success redirect, which is the only path our verify endpoint
 // handles right now.
 payment_method_types: ["card"],
 metadata: {
 user_id: user.id,
 target_role: targetRole,
 purpose: "boost",
 },
 });

 if (!session.url) {
 return NextResponse.json(
 { error: "Stripe did not return a session URL." },
 { status: 500 },
 );
 }
 return NextResponse.json({ url: session.url });
 } catch (err) {
 // eslint-disable-next-line no-console
 console.error("[api/stripe/checkout] session create failed", err);
 const message =
 err instanceof Error ? err.message : "Could not create checkout session.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
