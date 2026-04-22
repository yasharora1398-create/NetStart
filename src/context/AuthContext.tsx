import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured, MISSING_CONFIG_MESSAGE } from "@/lib/supabase";
import { isAdminUser } from "@/lib/mynet-storage";

type AuthResult = { error: AuthError | Error | null };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const notConfigured = (): AuthResult => ({ error: new Error(MISSING_CONFIG_MESSAGE) });

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
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, name) => {
    if (!isSupabaseConfigured) return notConfigured();
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await getSupabase().auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        configured: isSupabaseConfigured,
        isAdmin,
        signIn,
        signUp,
        signOut,
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
