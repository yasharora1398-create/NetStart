import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const DEVICE_ID_KEY = "polln8.device_id";

const generateDeviceId = (): string => {
 if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
 return crypto.randomUUID();
 }
 // Fallback for environments without crypto.randomUUID - pre-2022
 // Safari, etc. Good-enough randomness for a device anchor.
 return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const getDeviceId = (): string | null => {
 if (typeof window === "undefined") return null;
 try {
 let id = window.localStorage.getItem(DEVICE_ID_KEY);
 if (!id) {
 id = generateDeviceId();
 window.localStorage.setItem(DEVICE_ID_KEY, id);
 }
 return id;
 } catch {
 return null;
 }
};

// Local YYYY-MM-DD so each calendar day is a fresh bucket. Using
// the device's local date (not UTC) matches how a user thinks
// about "today vs yesterday."
const todayLocal = (): string => {
 const d = new Date();
 const y = d.getFullYear();
 const m = String(d.getMonth() + 1).padStart(2, "0");
 const day = String(d.getDate()).padStart(2, "0");
 return `${y}-${m}-${day}`;
};

// ───────────────────────────────────────────────────────────────
// Plausible custom events (funnel tracking).
//
// Plausible exposes window.plausible() once the script in
// app/layout.tsx loads. Calling it pushes a named event to the
// configured site, which appears in the Plausible dashboard under
// "Goals" -> "Custom events." Set those goals up before the events
// have reporting value:
//
// - signup_completed (verified email + first Profile visit)
// - mynet_submitted (sent profile for review)
// - first_match_action (first save/pass after acceptance)
// - first_chat_request_sent (first time a user kicks off a chat)
//
// All calls silently no-op on the server (window undefined) and on
// the client when Plausible hasn't loaded yet (ad blocker, dev
// without the script, etc.). Analytics must never throw and brick a
// user flow, so the wrapper catches everything.
// ───────────────────────────────────────────────────────────────
type PlausibleProps = Record<string, string | number | boolean | null>;

declare global {
 interface Window {
 plausible?: (
 eventName: string,
 options?: { props?: PlausibleProps; callback?: () => void },
 ) => void;
 }
}

export const track = (
 eventName: string,
 props?: PlausibleProps,
): void => {
 try {
 if (typeof window === "undefined") return;
 if (typeof window.plausible !== "function") return;
 window.plausible(eventName, props ? { props } : undefined);
 } catch {
 // never let analytics break the surrounding flow
 }
};

export const trackSignupCompleted = (role: "founder" | "partner"): void =>
 track("signup_completed", { role });

export const trackMynetSubmitted = (role: "founder" | "partner"): void =>
 track("mynet_submitted", { role });

export const trackFirstMatchAction = (
 action: "save" | "pass" | "open",
): void => track("first_match_action", { action });

export const trackFirstChatRequestSent = (): void =>
 track("first_chat_request_sent");

// ───────────────────────────────────────────────────────────────

let inFlight: Promise<void> | null = null;

// Log a single page view for the current device + today. Subsequent
// calls in the same day collapse to a no-op via the (device_id, day)
// primary key + onConflict: "device_id,day" upsert with ignoreDuplicates.
export const logPageView = async (): Promise<void> => {
 if (!isSupabaseConfigured) return;
 if (typeof window === "undefined") return;
 const deviceId = getDeviceId();
 if (!deviceId) return;

 // Tiny in-memory guard so we don't fire twice per mount race.
 if (inFlight) return inFlight;

 const day = todayLocal();
 inFlight = (async () => {
 try {
 await getSupabase()
 .from("page_views")
 .upsert(
 { device_id: deviceId, day },
 { onConflict: "device_id,day", ignoreDuplicates: true },
 );
 } catch {
 // Analytics is best-effort. Swallow errors so a logging
 // failure never breaks the page render.
 }
 })();
 return inFlight;
};
