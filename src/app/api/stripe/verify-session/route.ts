import { NextResponse } from "next/server";

import { getUserFromAuthHeader } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Frontend posts here after Stripe redirects back to
// /<purpose>?session_id=cs_xxx. We pull the session from Stripe,
// confirm payment_status is paid, confirm the session metadata
// names the same user that's calling us, then run the matching
// grant for whichever purpose is in the metadata:
//
//   boost      -> insert a 72-hour boosts row
//   verified   -> flip profiles.is_verified = true (permanent)
//   headliner  -> do BOTH (the combo SKU - cheaper than buying
//                 each separately)
//
// Each underlying grant is idempotent on its own merits, so a
// double-call with the same session_id is safe.

export const runtime = "nodejs";

const BOOST_DURATION_HOURS = 72;

type AdminClient = ReturnType<typeof getSupabaseAdmin>;
type GrantResult = { alreadyGranted: boolean; expiresAt?: string };

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

 if (session.metadata?.user_id !== user.id) {
 return NextResponse.json(
 { error: "Session belongs to a different account." },
 { status: 403 },
 );
 }
 if (session.payment_status !== "paid") {
 return NextResponse.json(
 { error: `Payment not completed (status: ${session.payment_status}).` },
 { status: 402 },
 );
 }

 const purpose = session.metadata?.purpose ?? "boost";
 const targetRole = session.metadata?.target_role;
 const admin = getSupabaseAdmin();

 try {
 if (purpose === "verified") {
 const result = await grantVerified(admin, user.id);
 return NextResponse.json({
 ok: true,
 purpose: "verified",
 alreadyGranted: result.alreadyGranted,
 });
 }

 if (purpose === "spotlight") {
 if (targetRole !== "founder" && targetRole !== "partner") {
 return NextResponse.json(
 { error: "Session metadata is missing target_role." },
 { status: 500 },
 );
 }
 // Spotlight = verified (permanent) + boost (72h). Run both;
 // both are idempotent.
 const verified = await grantVerified(admin, user.id);
 const boost = await grantBoost(admin, user.id, sessionId, targetRole);
 return NextResponse.json({
 ok: true,
 purpose: "spotlight",
 alreadyGranted: verified.alreadyGranted && boost.alreadyGranted,
 verified: verified.alreadyGranted ? "already" : "granted",
 boost: boost.alreadyGranted ? "already" : "granted",
 expiresAt: boost.expiresAt,
 });
 }

 // Default: boost.
 if (targetRole !== "founder" && targetRole !== "partner") {
 return NextResponse.json(
 { error: "Session metadata is missing target_role." },
 { status: 500 },
 );
 }
 const result = await grantBoost(admin, user.id, sessionId, targetRole);
 return NextResponse.json({
 ok: true,
 purpose: "boost",
 alreadyGranted: result.alreadyGranted,
 expiresAt: result.expiresAt,
 });
 } catch (err) {
 // eslint-disable-next-line no-console
 console.error("[verify-session] grant failed", err);
 const message =
 err instanceof Error ? err.message : "Could not grant purchase.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Internal grant helpers. Return shape:
//   { alreadyGranted: boolean, expiresAt?: string }
// Throw Error on failure (handler catches and 500s).

const grantBoost = async (
 admin: AdminClient,
 userId: string,
 sessionId: string,
 targetRole: "founder" | "partner",
): Promise<GrantResult> => {
 const { data: existing, error: existingErr } = await admin
 .from("boosts")
 .select("id, expires_at")
 .eq("stripe_session_id", sessionId)
 .maybeSingle();
 if (existingErr) {
 throw new Error(existingErr.message);
 }
 if (existing) {
 const e = existing as { expires_at: string };
 return { alreadyGranted: true, expiresAt: e.expires_at };
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
 const msg = insertErr.message || "";
 if (/relation.*boosts/i.test(msg) || /schema cache/i.test(msg)) {
 throw new Error(
 "boosts table is missing. Run supabase/migrations/0043_boosts.sql in the Supabase SQL editor.",
 );
 }
 throw new Error(msg);
 }
 return { alreadyGranted: false, expiresAt };
};

const grantVerified = async (
 admin: AdminClient,
 userId: string,
): Promise<GrantResult> => {
 const { data: existing, error: selErr } = await admin
 .from("profiles")
 .select("is_verified")
 .eq("user_id", userId)
 .maybeSingle();
 if (selErr) {
 const msg = selErr.message || "";
 if (/is_verified/i.test(msg) || /column.*does not exist/i.test(msg)) {
 throw new Error(
 "is_verified column is missing. Run supabase/migrations/0044_profile_verified.sql in the Supabase SQL editor.",
 );
 }
 throw new Error(msg);
 }
 if (existing && (existing as { is_verified?: boolean }).is_verified) {
 return { alreadyGranted: true };
 }
 const { error: updErr } = await admin
 .from("profiles")
 .update({ is_verified: true })
 .eq("user_id", userId);
 if (updErr) {
 throw new Error(updErr.message);
 }
 return { alreadyGranted: false };
};
