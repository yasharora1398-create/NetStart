/**
 * Weekly profile-setup reminder cron.
 *
 * Vercel triggers this route every Monday at 09:00 UTC (see
 * vercel.json crons). For every user whose profile.review_status is
 * still 'draft' AND who hasn't been emailed in the last 7 days, we
 * send a Polln8-branded "finish your profile" reminder via Resend and
 * stamp profiles.last_setup_reminder_at = now() so we never
 * double-email anyone in the same week.
 *
 * Required env vars (set in Vercel project settings):
 *   - CRON_SECRET          random hex; matches the Bearer token the
 *                          Vercel cron scheduler sends.
 *   - RESEND_API_KEY       re_... (same key the Supabase edge
 *                          function notify-email already uses).
 *   - RESEND_FROM          optional; defaults to
 *                          "Polln8 <noreply@polln8.com>".
 *   - APP_BASE_URL         optional; defaults to "https://polln8.com".
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *                          already present for the Stripe routes.
 *
 * Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET>. We
 * verify against process.env.CRON_SECRET; mismatch returns 401.
 *
 * The route is also a no-op-safe POST endpoint, so you can trigger
 * it manually:
 *   curl -X POST https://polln8.com/api/cron/profile-reminders \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Force Node runtime so we can use the service-role Supabase client
// + fetch to Resend without the Edge runtime's network policy
// surprises. Dynamic so caching never serves a stale "I just ran".
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_FROM =
 process.env.RESEND_FROM ?? "Polln8 <noreply@polln8.com>";
const APP_BASE_URL = (process.env.APP_BASE_URL ?? "https://polln8.com")
 .replace(/\/$/, "");
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Polln8 email palette mirrors the existing notify-email function so
// the reminder reads as the same brand surface.
const C = {
 bg: "#FAFAF7",
 surface: "#FFFFFF",
 ink: "#0F1410",
 muted: "#4A4D52",
 quiet: "#6B6E73",
 border: "#E8E6DF",
 accent: "#1F5F3E",
 onAccent: "#FAFAF7",
};

const escapeHtml = (s: string): string =>
 s
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;")
 .replace(/'/g, "&#39;");

const firstName = (raw: string | undefined | null): string => {
 if (!raw) return "there";
 const first = raw.trim().split(/\s+/)[0];
 return first || "there";
};

const buildEmail = (recipientName: string, unsubToken: string) => {
 const subject = "Your Polln8 profile is one step from going live.";
 const editUrl = `${APP_BASE_URL}/app/profile/edit`;
 const unsubUrl = `${APP_BASE_URL}/api/unsubscribe-reminders?token=${unsubToken}`;
 const settingsUrl = `${APP_BASE_URL}/app/settings`;
 const html = `<!doctype html>
<html lang="en">
 <head>
 <meta charset="utf-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1" />
 <meta name="x-apple-disable-message-reformatting" />
 <meta name="color-scheme" content="light" />
 <meta name="supported-color-schemes" content="light" />
 <title>${escapeHtml(subject)}</title>
 </head>
 <body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.ink};">
 <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
 Finish your profile to start matching on Polln8.
 </div>
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
 <tr>
 <td align="center" style="padding:32px 16px;">
 <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${C.surface};border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
 <tr>
 <td style="padding:20px 28px;border-bottom:1px solid ${C.border};font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:${C.ink};">
 Polln8
 </td>
 </tr>
 <tr>
 <td style="padding:32px 28px 36px;">
 <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.22em;color:${C.accent};text-transform:uppercase;margin:0 0 12px;">
 Finish your profile
 </div>
 <h1 style="margin:0 0 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:28px;line-height:1.18;letter-spacing:-0.02em;color:${C.ink};">
 Hey ${escapeHtml(recipientName)}, your profile&apos;s waiting.
 </h1>
 <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:${C.muted};">
 You signed up on Polln8 but haven&apos;t finished setting up
 your profile yet. Founders and partners already on the
 network can&apos;t see you, save you, or chat with you until
 you wrap up the setup form.
 </p>
 <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:${C.muted};">
 It takes about 3 minutes: a bio, a few skills, and either a
 project (founders) or what you&apos;re looking to join
 (partners). Once a reviewer accepts you, Match opens and you
 start seeing real people the same day.
 </p>
 <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
 <tr>
 <td style="border-radius:10px;background:${C.accent};">
 <a href="${editUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 26px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:-0.005em;color:${C.onAccent};text-decoration:none;border-radius:10px;">
 Finish your profile
 </a>
 </td>
 </tr>
 </table>
 <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${C.quiet};">
 Don&apos;t want these reminders?
 <a href="${unsubUrl}" style="color:${C.accent};text-decoration:underline;">Unsubscribe with one click</a>,
 or turn them off in
 <a href="${settingsUrl}" style="color:${C.accent};text-decoration:underline;">Settings &rarr; Reminder emails</a>.
 No login needed for the unsubscribe link.
 </p>
 </td>
 </tr>
 <tr>
 <td style="padding:18px 28px 22px;border-top:1px solid ${C.border};background:${C.bg};font-size:12px;line-height:1.55;color:${C.quiet};">
 Sent because you have a Polln8 account but haven&apos;t
 finished onboarding. You&apos;ll get one of these per week
 until you finish setup or
 <a href="${unsubUrl}" style="color:${C.quiet};text-decoration:underline;">opt out</a>.
 Polln8 &middot; polln8.com.
 </td>
 </tr>
 </table>
 <div style="font-size:11px;color:${C.quiet};padding-top:14px;">
 Polln8 &middot; polln8.com
 </div>
 </td>
 </tr>
 </table>
 </body>
</html>`;
 const text =
 `Hey ${recipientName}, your profile is waiting.\n\n` +
 "You signed up on Polln8 but haven't finished setting up your " +
 "profile yet. Founders and partners on the network can't see " +
 "you, save you, or chat with you until you wrap up the form.\n\n" +
 `Finish here: ${editUrl}\n\n` +
 "Don't want these reminders? One-click unsubscribe (no login " +
 `needed): ${unsubUrl}\n` +
 `Or turn them off in Settings: ${settingsUrl}\n`;
 return { subject, html, text };
};

type DraftUser = {
 user_id: string;
 last_setup_reminder_at: string | null;
 reminder_unsub_token: string;
};

export async function POST(req: Request) {
 // 1. Auth - reject anything that doesn't carry the Vercel cron
 //    bearer token. Vercel's scheduler attaches it automatically;
 //    manual invocations need to send the same header.
 const expected = process.env.CRON_SECRET;
 if (!expected) {
 return NextResponse.json(
 { ok: false, reason: "CRON_SECRET not configured" },
 { status: 500 },
 );
 }
 const auth = req.headers.get("authorization") ?? "";
 if (auth !== `Bearer ${expected}`) {
 return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
 }

 if (!RESEND_API_KEY) {
 return NextResponse.json(
 { ok: false, reason: "RESEND_API_KEY not configured" },
 { status: 500 },
 );
 }

 // 2. Pull draft users who haven't been emailed in the last 7 days.
 const admin = getSupabaseAdmin();
 const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
 .toISOString();

 const { data: candidates, error: queryError } = await admin
 .from("profiles")
 .select("user_id, last_setup_reminder_at, reminder_unsub_token")
 .eq("review_status", "draft")
 .eq("email_reminders_enabled", true);

 if (queryError) {
 return NextResponse.json(
 { ok: false, reason: `Query failed: ${queryError.message}` },
 { status: 502 },
 );
 }

 const due = (candidates ?? []).filter((row: DraftUser) => {
 if (!row.last_setup_reminder_at) return true;
 return row.last_setup_reminder_at < sevenDaysAgoIso;
 });

 // 3. For each due user, resolve their email + display name from
 //    auth.users, send via Resend, and stamp the timestamp on
 //    success. We swallow per-user failures so one bad row doesn't
 //    abort the whole run, but we tally them in the response.
 let sent = 0;
 let skipped = 0;
 let failed = 0;
 const failures: string[] = [];

 for (const row of due) {
 try {
 const { data: userResp, error: userErr } = await admin.auth.admin
 .getUserById(row.user_id);
 if (userErr || !userResp?.user?.email) {
 skipped++;
 continue;
 }
 const email = userResp.user.email;
 const metaName = (userResp.user.user_metadata as {
 name?: string;
 } | undefined)?.name;
 const recipientName = firstName(metaName ?? email.split("@")[0]);

 const { subject, html, text } = buildEmail(
 recipientName,
 row.reminder_unsub_token,
 );
 const resp = await fetch("https://api.resend.com/emails", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${RESEND_API_KEY}`,
 },
 body: JSON.stringify({
 from: RESEND_FROM,
 to: email,
 subject,
 html,
 text,
 }),
 });
 if (!resp.ok) {
 failed++;
 failures.push(`${row.user_id}: resend ${resp.status}`);
 continue;
 }
 // Stamp the send so the gate works next week.
 const { error: stampError } = await admin
 .from("profiles")
 .update({ last_setup_reminder_at: new Date().toISOString() })
 .eq("user_id", row.user_id);
 if (stampError) {
 // Email went out, only the bookkeeping write failed. Count
 // it as sent (the user did get the email) but log so we
 // can investigate.
 failures.push(`${row.user_id}: stamp ${stampError.message}`);
 }
 sent++;
 } catch (err) {
 failed++;
 failures.push(
 `${row.user_id}: ${
 err instanceof Error ? err.message : "unknown error"
 }`,
 );
 }
 }

 return NextResponse.json({
 ok: true,
 totalDraft: candidates?.length ?? 0,
 due: due.length,
 sent,
 skipped,
 failed,
 failures: failures.slice(0, 20),
 });
}
