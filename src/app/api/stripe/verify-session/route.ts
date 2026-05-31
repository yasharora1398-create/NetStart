import { NextResponse } from "next/server";

import { getUserFromAuthHeader } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Frontend posts here after Stripe redirects back to
// /boost?session_id=cs_xxx. We pull the session from Stripe,
// confirm payment_status is paid, confirm the session metadata
// names the same user that's calling us, then grant a 72-hour
// boost row via the service-role admin client.
//
// IDEMPOTENT by design: stripe_session_id is unique-constrained on
// the boosts table, so re-calling this endpoint with the same
// session id (eg user refreshes /boost?session_id=...) is a no-op
// and returns alreadyGranted: true.

export const runtime = "nodejs";

const BOOST_DURATION_HOURS = 72;

export async function POST(request: Request) {
 const user = await getUserFromAuthHeader(request);
 if (!user) {
 return NextResponse.json(
 { error: "Sign in to confirm your boost." },
 { status: 401 },
 );
 }

 let sessionId: string | null = null;
 try {
 const body = (await request.json()) as { sessionId?: string };
 sessionId = body.sessionId ?? null;
 } catch {
 return NextResponse.json({ error: "Bad request body." }, { status: 400 });
 }
 if (!sessionId || !sessionId.startsWith("cs_")) {
 return NextResponse.json({ error: "Missing session id." }, { status: 400 });
 }

 let session;
 try {
 session = await getStripe().checkout.sessions.retrieve(sessionId);
 } catch (err) {
 // eslint-disable-next-line no-console
 console.error("[api/stripe/verify-session] retrieve failed", err);
 const message =
 err instanceof Error ? err.message : "Could not load session from Stripe.";
 return NextResponse.json({ error: message }, { status: 500 });
 }

 // Bind the session to the caller. A user shouldn't be able to
 // submit someone else's session id and grant themselves the boost.
 if (session.metadata?.user_id !== user.id) {
 return NextResponse.json(
 { error: "Session belongs to a different account." },
 { status: 403 },
 );
 }

 // Card payments confirm "paid" immediately. Anything else means
 // the user hit cancel, or used an async payment method we don't
 // support yet.
 if (session.payment_status !== "paid") {
 return NextResponse.json(
 { error: `Payment not completed (status: ${session.payment_status}).` },
 { status: 402 },
 );
 }

 const targetRole = session.metadata?.target_role;
 if (targetRole !== "founder" && targetRole !== "partner") {
 // Shouldn't happen - we set this in the checkout endpoint - but
 // be defensive.
 return NextResponse.json(
 { error: "Session metadata is missing target_role." },
 { status: 500 },
 );
 }

 const admin = getSupabaseAdmin();

 // Idempotency check. Refreshing /boost?session_id=cs_xxx must not
 // grant a second boost.
 const { data: existing, error: existingErr } = await admin
 .from("boosts")
 .select("id, expires_at")
 .eq("stripe_session_id", sessionId)
 .maybeSingle();
 if (existingErr) {
 // eslint-disable-next-line no-console
 console.error("[verify-session] select existing failed", existingErr);
 return NextResponse.json({ error: existingErr.message }, { status: 500 });
 }
 if (existing) {
 return NextResponse.json({
 ok: true,
 alreadyGranted: true,
 expiresAt: existing.expires_at,
 });
 }

 const expiresAt = new Date(
 Date.now() + BOOST_DURATION_HOURS * 60 * 60 * 1000,
 ).toISOString();

 const { error: insertErr } = await admin.from("boosts").insert({
 user_id: user.id,
 target_role: targetRole,
 expires_at: expiresAt,
 stripe_session_id: sessionId,
 });
 if (insertErr) {
 // eslint-disable-next-line no-console
 console.error("[verify-session] insert failed", insertErr);
 const msg = insertErr.message || "";
 if (/relation.*boosts/i.test(msg) || /schema cache/i.test(msg)) {
 return NextResponse.json(
 {
 error:
 "boosts table is missing. Run supabase/migrations/0043_boosts.sql in the Supabase SQL editor.",
 },
 { status: 500 },
 );
 }
 return NextResponse.json({ error: msg }, { status: 500 });
 }

 return NextResponse.json({
 ok: true,
 alreadyGranted: false,
 expiresAt,
 });
}
