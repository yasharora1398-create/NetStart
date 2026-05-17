// Supabase Edge Function: notify-email
//
// Listens to inserts on public.notifications (via the 0023 DB
// trigger) and sends the recipient a Polln8-branded email through
// Resend. Templates are type-aware — chat messages, chat requests,
// applications, and profile-review outcomes each get a tailored
// layout. The in-app bell still works without this function;
// deploying this layer is what turns notifications into email.
//
// Deploy:
//   supabase functions deploy notify-email --no-verify-jwt
//
// Required secrets:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set RESEND_FROM="Polln8 <noreply@polln8.com>"
//   supabase secrets set APP_BASE_URL="https://polln8.com"
//   supabase secrets set WEBHOOK_SECRET=<random hex>   (matches DB trigger)

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

// Polln8 palette — matches the app design hand-off so the email
// reads as the same brand surface.
const C = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  ink: "#0F1410",
  muted: "#4A4D52",
  quiet: "#6B6E73",
  border: "#E8E6DF",
  accent: "#1F5F3E",
  accentBg: "#E8F0EA",
  onAccent: "#FAFAF7",
};

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
  const type: string = row?.type ?? "notification";
  const title: string = row?.title ?? "Polln8 update";
  const body: string = row?.body ?? "";
  const link: string | null = row?.link ?? null;
  const fromUserId: string | null = row?.from_user_id ?? null;
  // ISO timestamp from the notifications row. Used in subject
  // lines that include "at <time>" so each send is unique per
  // message (breaks Gmail / Apple Mail threading).
  const createdAt: string =
    typeof row?.created_at === "string" ? row.created_at : new Date().toISOString();

  if (!userId) return new Response("Missing user_id", { status: 400 });

  // Recipient email + display name (used in greeting).
  const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(
    userId,
  );
  if (userErr || !userResp?.user?.email) {
    return new Response("Recipient lookup failed", { status: 200 });
  }
  const to = userResp.user.email;
  const recipientName = firstName(
    (userResp.user.user_metadata as { name?: string } | undefined)?.name ??
      userResp.user.email.split("@")[0],
  );

  // Optional: sender name + first name (for chat_message / chat_request).
  // Tries three sources in order so the email never falls back to
  // the generic "Someone" if any of them resolve:
  //   1. notifications.from_user_id (set by migration 0029)
  //   2. sender UUID parsed out of the link (e.g., /chats/<uuid>)
  //   3. notifications.title — the SQL trigger writes it as
  //      "New message from <name>", so we can extract the name
  let senderName: string | null = null;
  let senderFirstName: string | null = null;
  let senderId: string | null = fromUserId ?? null;
  if (!senderId && typeof link === "string") {
    const m = link.match(/\/chats\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (m) senderId = m[1];
  }
  if (senderId) {
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", senderId)
      .maybeSingle();
    if (senderProfile?.full_name) {
      senderName = senderProfile.full_name;
      senderFirstName = firstName(senderProfile.full_name);
    }
  }
  // Last-ditch: pull the name out of the title which the SQL
  // trigger formatted as "New message from <name>".
  if (!senderName && typeof title === "string") {
    const m = title.match(/^New message from\s+(.+)$/);
    if (m && m[1] && m[1] !== "Someone") {
      senderName = m[1].trim();
      senderFirstName = firstName(senderName);
    }
  }

  const linkUrl = link
    ? `${APP_BASE_URL}${link.startsWith("/") ? link : `/${link}`}`
    : APP_BASE_URL;

  const ctx: TemplateCtx = {
    type,
    title,
    body,
    linkUrl,
    recipientName,
    senderName,
    senderFirstName,
    fromUserId,
    createdAt,
  };

  const { subject, html, text } = render(ctx);

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error("Resend failed", r.status, err);
    return new Response(`Resend ${r.status}`, { status: 502 });
  }
  return new Response("ok", { status: 200 });
});

// ──────────────────────────────────────────────────────────────────────
// Templating
// ──────────────────────────────────────────────────────────────────────

type TemplateCtx = {
  type: string;
  title: string;
  body: string;
  linkUrl: string;
  recipientName: string;
  senderName: string | null;
  senderFirstName: string | null;
  fromUserId: string | null;
  createdAt: string;
};

const render = (
  ctx: TemplateCtx,
): { subject: string; html: string; text: string } => {
  switch (ctx.type) {
    case "chat_message":
      return chatMessage(ctx);
    case "chat_request":
      return chatRequest(ctx);
    case "application_received":
    case "application_accepted":
    case "application_rejected":
      return applicationUpdate(ctx);
    case "profile_accepted":
    case "profile_rejected":
      return profileReview(ctx);
    default:
      return generic(ctx);
  }
};

const chatMessage = (ctx: TemplateCtx) => {
  // Dark-mode design per the chat_message hand-off. Custom HTML
  // (not the light `shell()` used by other templates):
  //   1. Speech bubble at the top, tail pointing down
  //   2. welcome.gif centered in the middle (the only image —
  //      everything else is real HTML)
  //   3. "Reply on Polln8" green button (real <a>, clickable)
  //   4. Italic green "Mute {first_name}" help line
  //   5. Green hairline + lighter footer with manage links
  const sender = ctx.senderName ?? "Someone";
  const senderFirst = ctx.senderFirstName ?? sender;
  // Subject embeds the time the notification was created so each
  // send is unique — keeps Gmail / Apple Mail / Outlook from
  // threading consecutive messages from the same sender into one
  // visual conversation. Format: "hey, Sarah Chen sent you a
  // message on Polln8 at 3:42 PM".
  const sentAt = new Date(ctx.createdAt ?? Date.now());
  const sentAtLabel = sentAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const subject = `hey, ${sender} sent you a message on Polln8 at ${sentAtLabel}`;
  const gifUrl = `${APP_BASE_URL}/email/welcome.gif`;
  const muteLink = ctx.fromUserId
    ? `${APP_BASE_URL}/chats/${ctx.fromUserId}`
    : `${APP_BASE_URL}/chats`;
  const replyHref = escapeHtml(ctx.linkUrl);

  // Dark palette for this email only.
  const D = {
    bg: "#1f1f1f",
    footerBg: "#3a3a3a",
    bubble: "#6a6a6a",
    text: "#ffffff",
    accent: "#1F5F3E",
    accentLink: "#5fc88c",
  };

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${D.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${D.text};">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(subject)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${D.bg};">
      <!-- Speech bubble -->
      <tr>
        <td align="center" style="padding:48px 24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;">
            <tr>
              <td style="background:${D.bubble};border-radius:18px;padding:24px 26px;color:${D.text};">
                <p style="margin:0 0 28px;font-size:18px;line-height:1.4;font-weight:500;color:${D.text};">
                  ${escapeHtml(ctx.body)}
                </p>
                <p style="margin:0;font-size:16px;color:${D.text};font-weight:400;">
                  — ${escapeHtml(sender)}
                </p>
              </td>
            </tr>
            <!-- Bubble tail (CSS-border triangle) -->
            <tr>
              <td style="line-height:0;font-size:0;padding:0;text-align:center;">
                <div style="width:0;height:0;border-top:24px solid ${D.bubble};border-left:18px solid transparent;border-right:18px solid transparent;margin:0 auto;display:inline-block;"></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hawk-moth / envelope GIF -->
      <tr>
        <td align="center" style="padding:8px 24px 32px;">
          <img src="${gifUrl}" alt="" width="280" style="display:inline-block;width:280px;max-width:80%;height:auto;border:0;outline:none;-ms-interpolation-mode:bicubic;pointer-events:none;" />
        </td>
      </tr>

      <!-- Reply on Polln8 button (real clickable <a>) -->
      <tr>
        <td align="center" style="padding:0 24px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td style="background:${D.accent};border-radius:14px;">
                <a href="${replyHref}" target="_blank" rel="noopener" style="display:inline-block;padding:18px 44px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:${D.text};text-decoration:none;border-radius:14px;letter-spacing:-0.01em;">
                  Reply on Polln8
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Mute help line -->
      <tr>
        <td align="center" style="padding:8px 24px 36px;">
          <p style="margin:0;font-size:16px;line-height:1.45;color:${D.text};max-width:440px;">
            Too many pings? <a href="${escapeHtml(muteLink)}" style="color:${D.accentLink};font-style:italic;text-decoration:none;">Mute ${escapeHtml(senderFirst)}</a> from your chat with them.
          </p>
        </td>
      </tr>

      <!-- Green hairline -->
      <tr>
        <td style="padding:0;background:${D.accent};height:3px;line-height:0;font-size:0;">&nbsp;</td>
      </tr>

      <!-- Footer -->
      <tr>
        <td align="center" style="padding:24px;background:${D.footerBg};">
          <p style="margin:0;font-size:15px;line-height:1.5;color:${D.text};max-width:480px;">
            Sent because you have a Polln8 account. Manage <a href="${APP_BASE_URL}/chats" style="color:${D.text};text-decoration:underline;">message preferences</a> or <a href="${APP_BASE_URL}/settings" style="color:${D.text};text-decoration:underline;">account settings</a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${ctx.body}\n— ${sender}\n\nReply: ${ctx.linkUrl}`;
  return { subject, html, text };
};

const chatRequest = (ctx: TemplateCtx) => {
  const sender = ctx.senderName ?? "A founder";
  const subject = `${sender} wants to chat on Polln8`;
  const lede = `Hey ${ctx.recipientName}, ${sender} wants to start a conversation.`;
  const inner = `
    ${heroEyebrow("Chat request")}
    ${heroTitle(`${escapeHtml(sender)} wants to chat.`)}
    ${heroLede(escapeHtml(lede))}
    ${ctx.body ? quoteBubble(ctx.body, sender) : ""}
    ${primaryButton(ctx.linkUrl, "Review request")}
  `;
  const text = `${lede}\n\n${ctx.body}\n\nReview: ${ctx.linkUrl}`;
  return { subject, html: shell(subject, inner), text };
};

const applicationUpdate = (ctx: TemplateCtx) => {
  const subject = `${ctx.title} — Polln8`;
  const lede = `Hey ${ctx.recipientName},`;
  const inner = `
    ${heroEyebrow("Application")}
    ${heroTitle(escapeHtml(ctx.title))}
    ${heroLede(escapeHtml(lede))}
    ${plainBody(ctx.body)}
    ${primaryButton(ctx.linkUrl, "Open Polln8")}
  `;
  const text = `${lede}\n\n${ctx.body}\n\n${ctx.linkUrl}`;
  return { subject, html: shell(subject, inner), text };
};

const profileReview = (ctx: TemplateCtx) => {
  const accepted = ctx.type === "profile_accepted";
  const subject = accepted
    ? "You're in. Welcome to Polln8."
    : "Polln8 application update";
  const lede = accepted
    ? `Hey ${ctx.recipientName}, your profile was approved. You can start matching now.`
    : `Hey ${ctx.recipientName}, your profile wasn't accepted this round. Tap below to update it and resubmit.`;
  const inner = `
    ${heroEyebrow(accepted ? "You're in" : "Update needed")}
    ${heroTitle(escapeHtml(ctx.title))}
    ${heroLede(escapeHtml(lede))}
    ${ctx.body ? plainBody(ctx.body) : ""}
    ${primaryButton(ctx.linkUrl, accepted ? "Start matching" : "Update profile")}
  `;
  const text = `${lede}\n\n${ctx.body}\n\n${ctx.linkUrl}`;
  return { subject, html: shell(subject, inner), text };
};

const generic = (ctx: TemplateCtx) => {
  const subject = `${ctx.title} — Polln8`;
  const lede = `Hey ${ctx.recipientName},`;
  const inner = `
    ${heroEyebrow("Polln8")}
    ${heroTitle(escapeHtml(ctx.title))}
    ${heroLede(escapeHtml(lede))}
    ${plainBody(ctx.body)}
    ${primaryButton(ctx.linkUrl, "Open Polln8")}
  `;
  const text = `${lede}\n\n${ctx.body}\n\n${ctx.linkUrl}`;
  return { subject, html: shell(subject, inner), text };
};

// ──────────────────────────────────────────────────────────────────────
// Building blocks
// ──────────────────────────────────────────────────────────────────────

type ShellOpts = {
  // When true, the body slot drops its 32x28 padding so the inner
  // markup can extend edge-to-edge inside the card (used for the
  // chat_message template's full-width hero GIF). The inner markup
  // is responsible for its own internal padding in this mode.
  fullBleed?: boolean;
};

const shell = (
  subject: string,
  inner: string,
  opts: ShellOpts = {},
): string => {
  const bodyPadding = opts.fullBleed ? "0" : "32px 28px 36px";
  return `<!doctype html>
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
    <!-- Hidden preheader (sets the preview text in inbox listings) -->
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(subject)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${C.surface};border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
            <!-- Branded header strip -->
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid ${C.border};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:${C.ink};">
                      Polln8
                    </td>
                    <td align="right" style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.2em;color:${C.quiet};text-transform:uppercase;">
                      Network
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body slot -->
            <tr>
              <td style="padding:${bodyPadding};">
                ${inner}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:18px 28px 22px;border-top:1px solid ${C.border};background:${C.bg};font-size:12px;line-height:1.55;color:${C.quiet};">
                Sent because you have a Polln8 account. Manage
                <a href="${APP_BASE_URL}/chats" style="color:${C.accent};text-decoration:none;">message preferences</a>
                or
                <a href="${APP_BASE_URL}/settings" style="color:${C.accent};text-decoration:none;">account settings</a>.
              </td>
            </tr>
          </table>
          <div style="font-size:11px;color:${C.quiet};padding-top:14px;">
            Polln8 · polln8.com
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const heroEyebrow = (text: string): string => `
  <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.22em;color:${C.accent};text-transform:uppercase;margin:0 0 12px;">
    ${escapeHtml(text)}
  </div>
`;

const heroTitle = (titleHtml: string): string => `
  <h1 style="margin:0 0 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:28px;line-height:1.18;letter-spacing:-0.02em;color:${C.ink};">
    ${titleHtml}
  </h1>
`;

const heroLede = (textHtml: string): string => `
  <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:${C.muted};">
    ${textHtml}
  </p>
`;

const quoteBubble = (raw: string, attribution: string): string => `
  <div style="background:${C.accentBg};border-left:3px solid ${C.accent};border-radius:8px;padding:16px 18px;margin:0 0 24px;font-size:15px;line-height:1.55;color:${C.ink};">
    "${escapeHtml(raw)}"
    <div style="margin-top:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.16em;color:${C.quiet};text-transform:uppercase;">
      — ${escapeHtml(attribution)}
    </div>
  </div>
`;

const plainBody = (raw: string): string => `
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${C.muted};white-space:pre-line;">
    ${escapeHtml(raw)}
  </p>
`;

const primaryButton = (href: string, label: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
    <tr>
      <td style="border-radius:10px;background:${C.accent};">
        <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 26px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:-0.005em;color:${C.onAccent};text-decoration:none;border-radius:10px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

const subtleHelp = (html: string): string => `
  <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:${C.quiet};">
    ${html}
  </p>
`;

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const firstName = (raw: string | undefined | null): string => {
  if (!raw) return "there";
  const first = raw.trim().split(/\s+/)[0];
  return first || "there";
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
