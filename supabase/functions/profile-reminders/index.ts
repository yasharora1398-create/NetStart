// Supabase Edge Function: profile-reminders
//
// Weekly cron-driven reminder to every Polln8 user whose profile is
// still in 'draft' status (i.e. they signed up but never finished
// the setup wizard). Idempotent and self-throttling: each profile
// has a last_setup_reminder_at timestamp, and we only email rows
// where that's NULL or more than 7 days old. Users who unsubscribed
// (email_reminders_enabled = false) are silently skipped.
//
// Triggered by pg_cron — see supabase/migrations/0049_*. The cron
// job sends an x-webhook-secret header that we verify against the
// WEBHOOK_SECRET env var (same pattern as notify-email).
//
// Deploy:
//   supabase functions deploy profile-reminders --no-verify-jwt
//
// Required secrets (set once per environment):
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set RESEND_FROM="Polln8 <noreply@polln8.com>"
//   supabase secrets set APP_BASE_URL="https://polln8.com"
//   supabase secrets set WEBHOOK_SECRET=<random hex>   (matches pg_cron call)

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Polln8 <noreply@polln8.com>";
const APP_BASE_URL = (Deno.env.get("APP_BASE_URL") ?? "https://polln8.com")
  .replace(/\/$/, "");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Polln8 email palette — kept in sync with notify-email so reminders
// read as the same brand surface in the recipient's inbox.
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

type EmailParts = { subject: string; html: string; text: string };

const buildEmail = (recipientName: string, unsubToken: string): EmailParts => {
  const subject = "Your Polln8 profile is one step from going live.";
  const editUrl = `${APP_BASE_URL}/app/profile/edit`;
  const unsubUrl =
    `${APP_BASE_URL}/api/unsubscribe-reminders?token=${unsubToken}`;
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

type DraftRow = {
  user_id: string;
  last_setup_reminder_at: string | null;
  reminder_unsub_token: string;
};

serve(async (req: Request) => {
  // Webhook secret gate. pg_cron sets this header on every scheduled
  // invocation (see migration 0049). Anyone hitting the function
  // without it gets bounced.
  if (WEBHOOK_SECRET) {
    if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }
  }
  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  // Pull eligible draft users — review_status='draft', opt-in still
  // true, and last_setup_reminder_at is null OR older than 7 days.
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString();

  const { data: candidates, error: queryError } = await admin
    .from("profiles")
    .select("user_id, last_setup_reminder_at, reminder_unsub_token")
    .eq("review_status", "draft")
    .eq("email_reminders_enabled", true);

  if (queryError) {
    return new Response(
      JSON.stringify({ ok: false, reason: queryError.message }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const due: DraftRow[] = (candidates ?? []).filter((row: DraftRow) =>
    !row.last_setup_reminder_at || row.last_setup_reminder_at < sevenDaysAgoIso
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];

  // Resend rate-limits free tier at 2 req/sec. Sleep 600ms between
  // sends so a queue of N users finishes at ~1.7 req/sec, well
  // under the limit. Paid tier (10 req/sec) doesn't need this but
  // a few seconds of extra wall-clock is cheap insurance.
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));
  let isFirst = true;

  for (const row of due) {
    if (!isFirst) await sleep(600);
    isFirst = false;
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
      const { error: stampError } = await admin
        .from("profiles")
        .update({ last_setup_reminder_at: new Date().toISOString() })
        .eq("user_id", row.user_id);
      if (stampError) {
        // The email went out, only the bookkeeping write failed.
        // Count it as sent so we don't try again immediately, but
        // log so we can investigate the column / RLS issue.
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

  return new Response(
    JSON.stringify({
      ok: true,
      totalDraft: candidates?.length ?? 0,
      due: due.length,
      sent,
      skipped,
      failed,
      failures: failures.slice(0, 20),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
});
