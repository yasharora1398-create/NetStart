import { NextResponse } from "next/server";

import { getUserFromAuthHeader } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";

// Stripe Checkout session creator. Frontend POSTs here with a
// Bearer token + an optional purpose ("boost" or "verified") in the
// JSON body, and we mint a Checkout session for the right product.
// Both perks redirect back to the same /<purpose>?session_id= URL
// so each page can run its own verify-session call on mount.

export const runtime = "nodejs";

type Purpose = "boost" | "verified" | "spotlight";

const isPurpose = (v: unknown): v is Purpose =>
 v === "boost" || v === "verified" || v === "spotlight";

export async function POST(request: Request) {
 const user = await getUserFromAuthHeader(request);
 if (!user) {
 return NextResponse.json(
 { error: "Sign in required to start checkout." },
 { status: 401 },
 );
 }

 // Purpose defaults to "boost" for backwards compatibility with the
 // existing /boost call site that doesn't send a body.
 let purpose: Purpose = "boost";
 try {
 const body = (await request.json()) as { purpose?: unknown };
 if (body && isPurpose(body.purpose)) purpose = body.purpose;
 } catch {
 /* empty body is fine, falls through to default */
 }

 // Map each purpose to its env-var price ID.
 const priceEnvName =
 purpose === "verified"
 ? "STRIPE_VERIFIED_PRICE_ID"
 : purpose === "spotlight"
 ? "STRIPE_SPOTLIGHT_PRICE_ID"
 : "STRIPE_BOOST_PRICE_ID";
 const priceId =
 purpose === "verified"
 ? process.env.STRIPE_VERIFIED_PRICE_ID
 : purpose === "spotlight"
 ? process.env.STRIPE_SPOTLIGHT_PRICE_ID
 : process.env.STRIPE_BOOST_PRICE_ID;
 if (!priceId) {
 return NextResponse.json(
 {
 error: `${priceEnvName} is not configured. Set it in .env.local + restart dev.`,
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
 // Stamped into metadata regardless of purpose so the verify
 // endpoint can use it if needed (verified ignores it).
 const role =
 user.user_metadata?.role === "founder" ? "founder" : "partner";
 const targetRole = role === "founder" ? "partner" : "founder";

 // Where Stripe sends the user after success. Each purpose lands
 // back on its own page so the success copy + verify-session call
 // is local to that page.
 const returnPath =
 purpose === "verified"
 ? "/app/verified"
 : purpose === "spotlight"
 ? "/app/spotlight"
 : "/app/boost";

 try {
 const session = await getStripe().checkout.sessions.create({
 mode: "payment",
 line_items: [{ price: priceId, quantity: 1 }],
 success_url: `${appUrl}${returnPath}?session_id={CHECKOUT_SESSION_ID}`,
 cancel_url: `${appUrl}${returnPath}`,
 customer_email: user.email ?? undefined,
 // Card-only for v1 - async payment methods (ACH, bank debits,
 // Klarna) settle hours-to-days later and would need a webhook
 // to grant the perk. Keeping payment_method_types at "card"
 // means payment_status flips to "paid" immediately on the
 // success redirect, which is the only path our verify endpoint
 // handles right now.
 payment_method_types: ["card"],
 metadata: {
 user_id: user.id,
 target_role: targetRole,
 purpose,
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
