import { NextResponse } from "next/server";

import { getUserFromAuthHeader } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Frontend posts here after Stripe redirects back to
// /<purpose>?session_id=cs_xxx. We pull the session from Stripe,
// confirm payment_status is paid, confirm the session metadata
// names the same user that's calling us, then either:
//   - purpose=boost: insert a 72-hour boosts row, or
//   - purpose=verified: flip profiles.is_verified = true.
//
// IDEMPOTENT by design.
//   - boost: stripe_session_id is unique-constrained, so re-calling
//     with the same id is a no-op.
//   - verified: we re-check is_verified before flipping, and return
//     alreadyGranted=true if it's already on. Re-running won't
//     duplicate-charge the user (Stripe doesn't recharge) and won't
//     re-flip a flag that's already true.

export const runtime = "nodejs";

const BOOST_DURATION_HOURS = 72;

export async function POST(request: Request) {
 const user = await getUserFromAuthHeader(request);
 if (!user) {
 return NextResponse.json(
 { error: "Sign in to confirm your purchase." },
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
 // submit someone else's session id and grant themselves the perk.
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

 // Purpose defaults to boost when missing (legacy sessions from
 // before purpose was added to metadata).
 const purpose = session.metadata?.purpose ?? "boost";
 const admin = getSupabaseAdmin();

 if (purpose === "verified") {
 return grantVerified(admin, user.id);
 }
 // Default: boost.
 const targetRole = session.metadata?.target_role;
 if (targetRole !== "founder" && targetRole !== "partner") {
 return NextResponse.json(
 { error: "Session metadata is missing target_role." },
 { status: 500 },
 );
 }
 return grantBoost(admin, user.id, sessionId, targetRole);
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Per-purpose grant logic. Each one is idempotent on its own merits.

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

const grantBoost = async (
 admin: AdminClient,
 userId: string,
 sessionId: string,
 targetRole: "founder" | "partner",
) => {
 // Idempotency check: a duplicate verify call for the same
 // session_id is a no-op.
 const { data: existing, error: existingErr } = await admin
 .from("boosts")
 .select("id, expires_at")
 .eq("stripe_session_id", sessionId)
 .maybeSingle();
 if (existingErr) {
 // eslint-disable-next-line no-console
 console.error("[verify-session] boost select existing failed", existingErr);
 return NextResponse.json({ error: existingErr.message }, { status: 500 });
 }
 if (existing) {
 return NextResponse.json({
 ok: true,
 purpose: "boost",
 alreadyGranted: true,
 expiresAt: existing.expires_at,
 });
 }

 const expiresAt = new Date(
 Date.now() + BOOST_DURATION_HOURS * 60 * 60 * 1000,
 ).toISOString();

 const { error: insertErr } = await admin.from("boosts").insert({
 user_id: userId,
 target_role: targetRole,
 expires_at: expiresAt,
 stripe_session_id: sessionId,
 });
 if (insertErr) {
 // eslint-disable-next-line no-console
 console.error("[verify-session] boost insert failed", insertErr);
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
 purpose: "boost",
 alreadyGranted: false,
 expiresAt,
 });
};

const grantVerified = async (admin: AdminClient, userId: string) => {
 // Check current state so we report alreadyGranted truthfully and
 // don't write the row if it's already on.
 const { data: existing, error: selErr } = await admin
 .from("profiles")
 .select("is_verified")
 .eq("user_id", userId)
 .maybeSingle();
 if (selErr) {
 // eslint-disable-next-line no-console
 console.error("[verify-session] verified select failed", selErr);
 const msg = selErr.message || "";
 if (/is_verified/i.test(msg) || /column.*does not exist/i.test(msg)) {
 return NextResponse.json(
 {
 error:
 "is_verified column is missing. Run supabase/migrations/0044_profile_verified.sql in the Supabase SQL editor.",
 },
 { status: 500 },
 );
 }
 return NextResponse.json({ error: msg }, { status: 500 });
 }
 if (existing && (existing as { is_verified?: boolean }).is_verified) {
 return NextResponse.json({
 ok: true,
 purpose: "verified",
 alreadyGranted: true,
 });
 }

 const { error: updErr } = await admin
 .from("profiles")
 .update({ is_verified: true })
 .eq("user_id", userId);
 if (updErr) {
 // eslint-disable-next-line no-console
 console.error("[verify-session] verified update failed", updErr);
 return NextResponse.json({ error: updErr.message }, { status: 500 });
 }

 return NextResponse.json({
 ok: true,
 purpose: "verified",
 alreadyGranted: false,
 });
};
