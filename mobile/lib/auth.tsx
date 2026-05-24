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
import { setSavedUser } from "./savedCount";
import { setSavedProjectsUser } from "./savedProjects";
import { setSentRequestsUser } from "./sentRequests";
import { setThreadUnreadUser } from "./threadUnread";

type AuthValue = {
 session: Session | null;
 user: User | null;
 loading: boolean;
 emailVerified: boolean;
 signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
 // signUp surfaces `duplicate: true` when the email is already on
 // file. Supabase's email-enumeration protection returns success
 // (no error) with an empty `user.identities` array in that case,
 // so we map it explicitly here so the UI can show a real "already
 // registered" message instead of the generic "check your inbox"
 // (which wouldn't be true - Supabase doesn't send a confirmation
 // email to an already-existing account).
 signUp: (
 email: string,
 password: string,
 name: string,
 role: "founder" | "partner",
 ) => Promise<{ error: Error | null; duplicate: boolean }>;
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
 // Hydrate per-user local stores from AsyncStorage.
 void setSavedUser(data.session?.user?.id ?? null);
 void setSavedProjectsUser(data.session?.user?.id ?? null);
 void setSentRequestsUser(data.session?.user?.id ?? null);
 void setThreadUnreadUser(data.session?.user?.id ?? null);
 if (data.session?.user) {
 // fire-and-forget; failure is silent
 void registerForPush();
 }
 });
 const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
 setSession(next);
 // Rebind per-user local stores on every auth change so different
 // users on the same device see their own data.
 void setSavedUser(next?.user?.id ?? null);
 void setSavedProjectsUser(next?.user?.id ?? null);
 void setSentRequestsUser(next?.user?.id ?? null);
 void setThreadUnreadUser(next?.user?.id ?? null);
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

 const signUp: AuthValue["signUp"] = async (email, password, name, role) => {
 // Verification email lands on the web app's /authenticated page
 // (same target the waitlist signup uses). Once email is verified,
 // Supabase auto-creates the session and the user can come back to
 // the mobile app and sign in normally. Mobile-native deep linking
 // can be added later once we have a real bundle id + universal
 // links configured.
 const { data, error } = await supabase.auth.signUp({
 email,
 password,
 options: {
 data: { name, role },
 emailRedirectTo: "https://polln8.com/authenticated",
 },
 });
 if (error) return { error, duplicate: false };
 // Email-enumeration protection signature: success with no
 // identities attached. Surface as duplicate so the UI doesn't
 // promise an email that Supabase won't actually send.
 const duplicate =
 Boolean(data?.user) && (data.user.identities?.length ?? 0) === 0;
 return { error: null, duplicate };
 };

 const requestPasswordReset: AuthValue["requestPasswordReset"] = async (
 email,
 ) => {
 const { error } = await supabase.auth.resetPasswordForEmail(email, {
 redirectTo: "https://polln8.com/reset-password",
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
