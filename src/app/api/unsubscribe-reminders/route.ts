/**
 * One-click unsubscribe from the weekly profile-setup reminder.
 *
 * The reminder email links here with a `?token=<uuid>` param. We
 * find the matching profile by token (unique index in migration
 * 0048), flip email_reminders_enabled to false, and render a small
 * standalone "you're unsubscribed" confirmation page.
 *
 * No login required — the token replaces auth. The token is per-
 * profile and stays stable across sends, so the same email link
 * always works. We don't rotate it on unsubscribe; the user can
 * re-enable via Settings, after which the same token still un-subs
 * them if they click the next reminder by mistake.
 *
 * GET, not POST, so anti-phishing mail clients (Gmail, Outlook)
 * that pre-fetch links to render previews can hit this safely —
 * they just flip an opt-out preference, no destructive action.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isUuid = (s: string): boolean =>
 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const page = ({
 title,
 message,
 success,
}: {
 title: string;
 message: string;
 success: boolean;
}): string => {
 // Standalone HTML — no app shell, no React. Keeps the page
 // independent of auth state and survives any client-side breakage.
 const tint = success ? "#1F5F3E" : "#9C2A2A";
 return `<!doctype html>
<html lang="en">
 <head>
 <meta charset="utf-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1" />
 <title>${title} — Polln8</title>
 <style>
 body {
 margin: 0;
 padding: 0;
 font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
 Helvetica, Arial, sans-serif;
 background: #FAFAF7;
 color: #0F1410;
 }
 .wrap {
 max-width: 480px;
 margin: 80px auto 0;
 padding: 32px 24px;
 background: #FFFFFF;
 border: 1px solid #E8E6DF;
 border-radius: 14px;
 }
 .eyebrow {
 font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
 font-size: 11px;
 letter-spacing: 0.22em;
 color: ${tint};
 text-transform: uppercase;
 margin: 0 0 12px;
 }
 h1 {
 margin: 0 0 12px;
 font-size: 28px;
 line-height: 1.18;
 letter-spacing: -0.02em;
 }
 p {
 margin: 0 0 16px;
 font-size: 15px;
 line-height: 1.55;
 color: #4A4D52;
 }
 a.button {
 display: inline-block;
 margin-top: 10px;
 padding: 12px 22px;
 background: ${tint};
 color: #FAFAF7;
 text-decoration: none;
 border-radius: 10px;
 font-weight: 700;
 font-size: 15px;
 }
 .footer {
 max-width: 480px;
 margin: 24px auto 80px;
 padding: 0 24px;
 font-size: 12px;
 color: #6B6E73;
 text-align: center;
 }
 </style>
 </head>
 <body>
 <div class="wrap">
 <p class="eyebrow">Reminder emails</p>
 <h1>${title}</h1>
 <p>${message}</p>
 <a href="https://polln8.com/app/settings" class="button">Open Polln8</a>
 </div>
 <p class="footer">Polln8 &middot; polln8.com</p>
 </body>
</html>`;
};

export async function GET(req: Request) {
 const url = new URL(req.url);
 const token = url.searchParams.get("token")?.trim() ?? "";

 if (!token || !isUuid(token)) {
 return new Response(
 page({
 title: "Link not recognized.",
 message:
 "This unsubscribe link is missing or malformed. If you copied it from an email, try clicking the original link directly.",
 success: false,
 }),
 { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
 );
 }

 const admin = getSupabaseAdmin();

 // Atomic: turn the toggle off only if the token matches a real
 // profile. update() with a where on the token returns the row that
 // was matched; an empty result means the token didn't resolve, so
 // we render the bad-link page (no information leak about whether
 // the user was already unsubscribed).
 const { data, error } = await admin
 .from("profiles")
 .update({ email_reminders_enabled: false })
 .eq("reminder_unsub_token", token)
 .select("user_id")
 .maybeSingle();

 if (error) {
 return new Response(
 page({
 title: "Something went wrong.",
 message:
 "We couldn't update your preference right now. Try again in a few minutes, or change it from your Settings page.",
 success: false,
 }),
 { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } },
 );
 }

 if (!data) {
 return new Response(
 page({
 title: "Link not recognized.",
 message:
 "We couldn't match this unsubscribe link to an account. It may have expired or already been used from a different email.",
 success: false,
 }),
 { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
 );
 }

 return new Response(
 page({
 title: "Unsubscribed.",
 message:
 "You won't get any more profile-setup reminder emails from Polln8. You can turn them back on from your Settings page if you change your mind.",
 success: true,
 }),
 { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
 );
}
