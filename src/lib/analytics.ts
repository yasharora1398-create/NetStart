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
