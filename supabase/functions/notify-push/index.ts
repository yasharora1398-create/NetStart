// Supabase Edge Function: notify-push
//
// Listens to inserts on public.notifications via a database webhook and
// forwards each one to Expo's push API for the recipient's device.
// In-app bell still works without this function. Deploy this to send
// real-time push.
//
// Deploy:
//   supabase functions deploy notify-push --no-verify-jwt
//
// Set the webhook secret to gate inbound calls so randos can't trigger:
//   supabase secrets set PUSH_WEBHOOK_SECRET=<random hex>
//
// Then in Supabase Dashboard create a Database Webhook:
//   Table:   public.notifications
//   Events:  INSERT
//   URL:     https://<project-ref>.supabase.co/functions/v1/notify-push
//   Method:  POST
//   Header:  X-Webhook-Secret: <same random hex>

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("PUSH_WEBHOOK_SECRET");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req) => {
  if (WEBHOOK_SECRET) {
    if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const row = payload.record ?? payload.new ?? payload;
  const userId: string | undefined = row?.user_id;
  const title: string = row?.title ?? "NetStart";
  const body: string = row?.body ?? "";
  const link: string | null = row?.link ?? null;
  const type: string = row?.type ?? "notification";

  if (!userId) {
    return new Response("Missing user_id", { status: 400 });
  }

  const { data, error } = await admin
    .from("profiles")
    .select("expo_push_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.expo_push_token) {
    // No token registered; nothing to do.
    return new Response("ok", { status: 200 });
  }

  const message = {
    to: data.expo_push_token,
    sound: "default",
    title,
    body,
    data: { link, type, userId },
    priority: "high",
    channelId: "default",
  };

  try {
    const r = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    if (!r.ok) {
      const errBody = await r.text();
      console.error("Expo push failed", r.status, errBody);
      return new Response(`Expo ${r.status}`, { status: 502 });
    }
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Expo push error", err);
    return new Response("error", { status: 500 });
  }
});
