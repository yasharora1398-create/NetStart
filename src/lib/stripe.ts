import Stripe from "stripe";

// Server-only Stripe SDK singleton. NEVER import this from client
// code - the secret key would end up in the browser bundle. The
// import path is allowed only from src/app/api/.../route.ts files
// and other server-only modules.

let client: Stripe | null = null;

export const getStripe = (): Stripe => {
 const secret = process.env.STRIPE_SECRET_KEY;
 if (!secret) {
 throw new Error(
 "STRIPE_SECRET_KEY is missing. Add it to .env.local (server-only, no NEXT_PUBLIC_ prefix) and restart npm run dev.",
 );
 }
 if (!client) {
 // No apiVersion pin - lets the SDK use whatever its own default
 // is for this installed version (currently 22.x). Bump
 // intentionally if a specific event payload shape matters.
 client = new Stripe(secret);
 }
 return client;
};
