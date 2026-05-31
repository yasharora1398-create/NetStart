import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client. BYPASSES Row-Level Security so it
// can write rows on behalf of unauthenticated callers (eg the
// Stripe verify-session endpoint, which has no user session at the
// moment Stripe redirects back).
//
// NEVER import this from client code. The service-role key would
// end up in the browser bundle and any visitor could read/write any
// row in the database. It's gated to server-only paths
// (src/app/api/.../route.ts, server actions, route segments marked
// with runtime = "nodejs").

let admin: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url) {
 throw new Error(
 "NEXT_PUBLIC_SUPABASE_URL is missing. Add it to .env.local.",
 );
 }
 if (!serviceKey) {
 throw new Error(
 "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local (server-only, no NEXT_PUBLIC_ prefix) and restart npm run dev.",
 );
 }
 if (!admin) {
 admin = createClient(url, serviceKey, {
 auth: {
 // We never persist a session for the admin client - each
 // server call uses the raw service-role JWT, no refresh,
 // no cookie.
 persistSession: false,
 autoRefreshToken: false,
 },
 });
 }
 return admin;
};
