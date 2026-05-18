import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured, MISSING_CONFIG_MESSAGE } from "@/lib/supabase";
import { isAdminUser } from "@/lib/mynet-storage";
import {
  normalizeAuthError,
  refreshSessionOrThrow,
} from "@/lib/auth-session";
import { setSavedProjectsUser } from "@/lib/savedProjects";
import { setThreadUnreadUser } from "@/lib/threadUnread";

type AuthResult = { error: AuthError | Error | null };

// signUp also surfaces whether the email was already registered.
// Supabase's "email enumeration protection" returns a non-error
// response with an empty user.identities array when the address is
// already on file - which our UI needs to render as "this email is
// already registered" instead of silently sending the user to the
// "check your inbox" page.
type SignUpResult = AuthResult & { duplicate: boolean };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  signIn: (
    email: string,
    password: string,
    captchaToken?: string,
  ) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: "founder" | "builder",
    captchaToken?: string,
  ) => Promise<SignUpResult>;
  // "tab"    — sign out of THIS tab only. Other tabs of the same
  //            browser stay signed in. Implemented as a per-tab
  //            sessionStorage flag that masks the shared Supabase
  //            session; we deliberately do NOT call
  //            supabase.auth.signOut(), which would clear the shared
  //            localStorage token and propagate to every tab via
  //            storage events.
  // "local"  — sign out of this browser (Supabase "local" scope).
  //            Affects all tabs of this browser. Other browsers /
  //            devices stay signed in.
  // "global" — sign out everywhere (Supabase "global" scope). All
  //            sessions on every device are invalidated server-side.
  signOut: (scope?: "tab" | "local" | "global") => Promise<void>;
  requestPasswordReset: (
    email: string,
    captchaToken?: string,
  ) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  updateEmail: (newEmail: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const notConfigured = (): AuthResult => ({ error: new Error(MISSING_CONFIG_MESSAGE) });
const notConfiguredSignUp = (): SignUpResult => ({
  error: new Error(MISSING_CONFIG_MESSAGE),
  duplicate: false,
});

// Trim + lowercase. Supabase preserves the case it was given on
// signup, so user "Foo@x.com" and "foo@x.com" become two distinct
// rows otherwise. Normalising on the way in fixes that for both
// signup and signin.
const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();

// Per-tab "signed out" flag. Lives in sessionStorage so it's
// scoped to a single tab — sessionStorage is NOT shared across
// tabs the way localStorage is. Set by signOut("tab"); cleared by
// any successful sign-in (so the user can re-auth without
// reloading) and by the global sign-out path.
const TAB_SIGNED_OUT_KEY = "polln8.tabSignedOut.v1";

const readTabSignedOut = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(TAB_SIGNED_OUT_KEY) === "1";
  } catch {
    return false;
  }
};

const writeTabSignedOut = (value: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(TAB_SIGNED_OUT_KEY, "1");
    else window.sessionStorage.removeItem(TAB_SIGNED_OUT_KEY);
  } catch {
    // Storage disabled / quota — non-fatal; the user is briefly
    // still "signed in" in this tab until they reload.
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [rawSession, setRawSession] = useState<Session | null>(null);
  const [tabSignedOut, setTabSignedOut] = useState<boolean>(readTabSignedOut);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);

  // Effective session: real Supabase session unless this tab has
  // been "soft-signed-out" via the per-tab flag. Other tabs read
  // the same Supabase session and aren't affected.
  const session = tabSignedOut ? null : rawSession;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setRawSession(data.session);
      setLoading(false);
      // Hydrate per-user local stores from localStorage.
      setSavedProjectsUser(data.session?.user?.id ?? null);
      setThreadUnreadUser(data.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setRawSession(next);
      // A real Supabase sign-in event (the user re-authed in THIS
      // tab) clears the per-tab "signed out" mask so the UI snaps
      // back to the signed-in state.
      if (event === "SIGNED_IN" && next) {
        writeTabSignedOut(false);
        setTabSignedOut(false);
      }
      // Rebind per-user local stores on every auth change so different
      // users on the same device see their own saves.
      setSavedProjectsUser(next?.user?.id ?? null);
      setThreadUnreadUser(next?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    isAdminUser(uid).then((flag) => {
      if (!cancelled) setIsAdmin(flag);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signIn: AuthContextValue["signIn"] = async (
    email,
    password,
    captchaToken,
  ) => {
    if (!isSupabaseConfigured) return notConfigured();
    const { error } = await getSupabase().auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    return { error };
  };

  const signUp: AuthContextValue["signUp"] = async (
    email,
    password,
    name,
    role,
    captchaToken,
  ) => {
    if (!isSupabaseConfigured) return notConfiguredSignUp();
    // After the user clicks the verification link in the email, send
    // them to /authenticated. Supabase auto-creates a session at
    // verify-time and the page reads that — keeps them signed in.
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/authenticated`
        : undefined;
    const { data, error } = await getSupabase().auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        data: { name: name.trim(), role },
        emailRedirectTo,
        // Supabase verifies this against Cloudflare's API using the
        // secret key configured in Auth -> CAPTCHA settings. If
        // CAPTCHA is enabled there but token is missing or invalid,
        // signUp rejects with a captcha-related error.
        captchaToken,
      },
    });
    if (error) return { error, duplicate: false };

    // Supabase's email-enumeration-protection signature: "success"
    // with a phantom user that has no identities attached. The address
    // is already registered (confirmed or otherwise). We surface this
    // as a duplicate so the UI can route appropriately.
    const duplicate =
      Boolean(data?.user) && (data.user.identities?.length ?? 0) === 0;
    return { error: null, duplicate };
  };

  const signOut = async (
    scope: "tab" | "local" | "global" = "local",
  ) => {
    if (!isSupabaseConfigured) return;
    if (scope === "tab") {
      // Mask the shared Supabase session in THIS tab only. The
      // localStorage token is left intact so other tabs and the
      // Supabase client itself stay valid; refreshing this tab
      // keeps the user "signed out" because the flag lives in
      // sessionStorage (which survives reload but not new tabs).
      writeTabSignedOut(true);
      setTabSignedOut(true);
      return;
    }
    // Any real Supabase sign-out invalidates the shared session,
    // so the per-tab mask is no longer needed anywhere.
    writeTabSignedOut(false);
    setTabSignedOut(false);
    await getSupabase().auth.signOut({ scope });
  };

  const requestPasswordReset: AuthContextValue["requestPasswordReset"] = async (
    email,
    captchaToken,
  ) => {
    if (!isSupabaseConfigured) return notConfigured();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await getSupabase().auth.resetPasswordForEmail(
      normalizeEmail(email),
      captchaToken ? { redirectTo, captchaToken } : { redirectTo },
    );
    return { error };
  };

  const updatePassword: AuthContextValue["updatePassword"] = async (
    newPassword,
  ) => {
    if (!isSupabaseConfigured) return notConfigured();
    const supabase = getSupabase();
    try {
      // Idle-tab guard: refresh before updateUser, same defensive
      // pattern as setRole. See src/lib/auth-session.ts.
      await refreshSessionOrThrow(supabase, "change your password");
    } catch (err) {
      return { error: err as Error };
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return { error: normalizeAuthError(error, "change your password") };
    }
    return { error: null };
  };

  const updateEmail: AuthContextValue["updateEmail"] = async (newEmail) => {
    if (!isSupabaseConfigured) return notConfigured();
    const supabase = getSupabase();
    try {
      await refreshSessionOrThrow(supabase, "change your email");
    } catch (err) {
      return { error: err as Error };
    }
    const { error } = await supabase.auth.updateUser({
      email: normalizeEmail(newEmail),
    });
    if (error) {
      return { error: normalizeAuthError(error, "change your email") };
    }
    return { error: null };
  };

  const resendVerification: AuthContextValue["resendVerification"] = async (
    email,
  ) => {
    if (!isSupabaseConfigured) return notConfigured();
    const { error } = await getSupabase().auth.resend({
      type: "signup",
      email: normalizeEmail(email),
    });
    return { error };
  };

  const emailVerified = Boolean(session?.user?.email_confirmed_at);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        configured: isSupabaseConfigured,
        isAdmin,
        emailVerified,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        updateEmail,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
