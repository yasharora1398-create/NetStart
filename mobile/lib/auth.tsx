import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { clearPushToken, registerForPush } from "./push";

type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: Error | null }>;
  signOut: (scope?: "local" | "global") => Promise<void>;
  requestPasswordReset: (
    email: string,
  ) => Promise<{ error: Error | null }>;
  updatePassword: (
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
  updateEmail: (
    newEmail: string,
  ) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        // fire-and-forget; failure is silent
        void registerForPush();
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" && next?.user) {
        void registerForPush();
      }
      if (event === "SIGNED_OUT") {
        // best-effort; clearPushToken needs an auth context, but at sign
        // out the JWT is gone, so we just no-op silently.
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp: AuthValue["signUp"] = async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error };
  };

  const signOut = async (scope: "local" | "global" = "local") => {
    // clear before signOut so the JWT is still valid
    await clearPushToken();
    await supabase.auth.signOut({ scope });
  };

  const updatePassword: AuthValue["updatePassword"] = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const updateEmail: AuthValue["updateEmail"] = async (newEmail) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return { error };
  };

  const requestPasswordReset: AuthValue["requestPasswordReset"] = async (
    email,
  ) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        emailVerified: Boolean(session?.user?.email_confirmed_at),
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        updateEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
