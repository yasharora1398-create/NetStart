import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured, MISSING_CONFIG_MESSAGE } from "@/lib/supabase";
import { isAdminUser } from "@/lib/mynet-storage";

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
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<SignUpResult>;
  signOut: (scope?: "local" | "global") => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
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

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    if (!isSupabaseConfigured) return notConfigured();
    const { error } = await getSupabase().auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    return { error };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, name) => {
    if (!isSupabaseConfigured) return notConfiguredSignUp();
    // After the user clicks the verification link in the email, send
    // them to /authenticated. Supabase auto-creates a session at
    // verify-time and the page reads that - keeps them signed in.
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/authenticated`
        : undefined;
    const { data, error } = await getSupabase().auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: { name: name.trim() }, emailRedirectTo },
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

  const signOut = async (scope: "local" | "global" = "local") => {
    if (!isSupabaseConfigured) return;
    await getSupabase().auth.signOut({ scope });
  };

  const requestPasswordReset: AuthContextValue["requestPasswordReset"] = async (
    email,
  ) => {
    if (!isSupabaseConfigured) return notConfigured();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await getSupabase().auth.resetPasswordForEmail(
      normalizeEmail(email),
      { redirectTo },
    );
    return { error };
  };

  const updatePassword: AuthContextValue["updatePassword"] = async (
    newPassword,
  ) => {
    if (!isSupabaseConfigured) return notConfigured();
    const { error } = await getSupabase().auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const updateEmail: AuthContextValue["updateEmail"] = async (newEmail) => {
    if (!isSupabaseConfigured) return notConfigured();
    const { error } = await getSupabase().auth.updateUser({
      email: normalizeEmail(newEmail),
    });
    return { error };
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
