import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Idle-tab guard for auth.updateUser / auth.resend calls.
 *
 * Background: Supabase's auth.updateUser is unusually sensitive to a
 * stale in-memory session. Calling it after the JWT has expired but
 * before the auto-refresh fires throws the cryptic "Auth session
 * missing!" error, which we saw in the role-switch flow. Same
 * vulnerability for auth.updateUser({ email }), auth.updateUser({
 * password }), auth.resend, etc.
 *
 * The cheap, reliable fix is to refresh the session unconditionally
 * before invoking those endpoints. refreshSession() is a no-op when
 * the in-memory session is already current and a cheap re-hydration
 * when it has gone stale. If the refresh itself fails (truly signed
 * out, refresh token revoked), we surface a readable error instead
 * of letting the underlying SDK leak its phrasing.
 */
export const refreshSessionOrThrow = async (
  supabase: SupabaseClient,
  friendlyContextForError = "continue",
): Promise<void> => {
  const { error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(
      `Your session expired. Sign in again to ${friendlyContextForError}.`,
    );
  }
};

/**
 * Wraps an auth call so that any "auth session missing" string in
 * the error gets remapped to our readable phrasing. Catches the race
 * where the session was wiped between the refresh and the actual
 * call (rare, but possible if the user signed out in another tab).
 */
export const normalizeAuthError = (
  err: unknown,
  friendlyContextForError = "continue",
): Error => {
  const msg =
    err instanceof Error
      ? err.message
      : (err as { message?: string } | null)?.message ?? "";
  if (msg.toLowerCase().includes("auth session")) {
    return new Error(
      `Your session expired. Sign in again to ${friendlyContextForError}.`,
    );
  }
  return err instanceof Error ? err : new Error(msg || "Unknown error");
};
