import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
 throw new Error(
 "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env",
 );
}

// Storage selection by runtime:
//
// "¢ Native (iOS / Android in Expo Go or a build) " AsyncStorage, the
// standard React Native KV store.
//
// "¢ Web (this same bundle served from polln8.com/m/) " fall through
// to Supabase's default browser storage (window.localStorage). The
// Next.js side of polln8.com uses the same default, so the two
// bundles end up sharing one storage entry under the same key
// (`sb-<project-ref>-auth-token`). Without this, the Expo web
// bundle was writing to AsyncStorage's own localStorage namespace
// (`@react-native-async-storage/...`), creating a second
// independent session: sign-in / sign-out on one bundle didn't
// propagate to the other.
const storage = Platform.OS === "web" ? undefined : AsyncStorage;

export const supabase = createClient(url, anon, {
 auth: {
 storage,
 autoRefreshToken: true,
 persistSession: true,
 // On web we let Supabase parse password-reset / email-confirm
 // links out of the URL (it Just Works because the web bundle
 // mounts on the same origin). On native there's no URL bar, so
 // disable the parse path.
 detectSessionInUrl: Platform.OS === "web",
 },
});
