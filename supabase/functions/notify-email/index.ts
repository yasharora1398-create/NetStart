// Supabase Edge Function: notify-email
//
// Listens to inserts on public.notifications via a database webhook and
// sends the recipient an email through Resend. The in-app bell still
// works without this function. Deploy this to send real email too.
//
// Deploy:
//   supabase functions deploy notify-email --no-verify-jwt
//
// Set secrets:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set RESEND_FROM="NetStart <noreply@yourdomain.com>"
//   supabase secrets set APP_BASE_URL="https://netstart.vercel.app"
//
// Then in Supabase Dashboard create a Database Webhook:
//   Table: public.notifications
//   Events: INSERT
//   URL: https://<project-ref>.supabase.co/functions/v1/notify-email
//   HTTP method: POST
//   Add a secret header so only this hook can trigger:
//     X-Webhook-Secret: (set WEBHOOK_SECRET via supabase secrets set)

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "NetStart <noreply@example.com>";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "https://netstart.app";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req) => {
  if (WEBHOOK_SECRET) {
    if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }
  }
  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const row = payload.record ?? payload.new ?? payload;
  const userId: string | undefined = row?.user_id;
  const title: string = row?.title ?? "NetStart update";
  const body: string = row?.body ?? "";
  const link: string | null = row?.link ?? null;

  if (!userId) return new Response("Missing user_id", { status: 400 });

  const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(
    userId,
  );
  if (userErr || !userResp?.user?.email) {
    return new Response("Recipient lookup failed", { status: 200 });
  }
  const to = userResp.user.email;
  const linkUrl = link
    ? `${APP_BASE_URL.replace(/\/$/, "")}${link.startsWith("/") ? link : `/${link}`}`
    : APP_BASE_URL;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0a0a0a;color:#e6e6e6;padding:24px;">
      <div style="max-width:520px;margin:0 auto;border:1px solid #2a2a2a;border-radius:4px;overflow:hidden;background:#111;">
        <div style="padding:24px 28px;border-bottom:1px solid #2a2a2a;">
          <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.25em;color:#c8a45c;text-transform:uppercase;">NetStart</p>
          <h1 style="margin:0;font-size:22px;line-height:1.2;color:#fff;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:24px 28px;font-size:14px;line-height:1.6;white-space:pre-line;color:#bdbdbd;">${escapeHtml(body)}</div>
        <div style="padding:0 28px 28px;">
          <a href="${linkUrl}" style="display:inline-block;background:#c8a45c;color:#0a0a0a;padding:10px 18px;border-radius:2px;font-weight:600;text-decoration:none;font-size:13px;">Open NetStart</a>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #2a2a2a;font-size:11px;color:#666;">
          You're getting this because you have an account on NetStart.
        </div>
      </div>
    </div>
  `;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject: title,
      html,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error("Resend failed", r.status, err);
    return new Response(`Resend ${r.status}`, { status: 502 });
  }
  return new Response("ok", { status: 200 });
});

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
