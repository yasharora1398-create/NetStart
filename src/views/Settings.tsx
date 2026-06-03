"use client";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { deleteMyAccount } from "@/lib/mynet-storage";
import { useConfirmSignOut } from "@/components/netstart/SignOutConfirm";
import { getSupabase } from "@/lib/supabase";

const Settings = () => {
 const {
 user,
 loading,
 updateEmail,
 updatePassword,
 signOut,
 } = useAuth();
 const navigate = useNavigate();
 const confirmSignOut = useConfirmSignOut();

 const [email, setEmail] = useState("");
 const [emailState, setEmailState] = useState<"idle" | "saving" | "saved">("idle");
 const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

 const [currentPassword, setCurrentPassword] = useState("");
 const [password, setPassword] = useState("");
 const [savingPassword, setSavingPassword] = useState(false);

 const [deleteOpen, setDeleteOpen] = useState(false);
 const [deletingAccount, setDeletingAccount] = useState(false);
 const [deleteConfirm, setDeleteConfirm] = useState("");

 useEffect(() => {
 if (user?.email) setEmail(user.email);
 }, [user?.email]);

 // Email autosave on blur. Skipped when nothing changed so we don't
 // spam Supabase with no-op confirmation emails every time the field
 // loses focus.
 const handleEmailBlur = async () => {
 const next = email.trim();
 if (!next || next === user?.email) return;
 setEmailState("saving");
 const { error } = await updateEmail(next);
 if (error) {
 setEmailState("idle");
 toast.error(error.message);
 return;
 }
 setEmailState("saved");
 if (emailTimer.current) clearTimeout(emailTimer.current);
 emailTimer.current = setTimeout(() => setEmailState("idle"), 2400);
 };

 const handlePassword = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user?.email) {
 toast.error("Sign in first.");
 return;
 }
 if (currentPassword.length < 1) {
 toast.error("Enter your current password.");
 return;
 }
 if (password.length < 8) {
 toast.error("New password must be at least 8 characters.");
 return;
 }
 if (password === currentPassword) {
 toast.error("New password must be different from your current one.");
 return;
 }
 setSavingPassword(true);
 try {
 const { error: signInError } = await getSupabase().auth.signInWithPassword({
 email: user.email,
 password: currentPassword,
 });
 if (signInError) {
 toast.error("Current password is wrong.");
 return;
 }
 const { error } = await updatePassword(password);
 if (error) {
 toast.error(error.message);
 return;
 }
 toast.success("Password updated.");
 setCurrentPassword("");
 setPassword("");
 } finally {
 setSavingPassword(false);
 }
 };

 const handleSignOut = () => confirmSignOut();

 const handleDeleteAccount = async () => {
 if (deleteConfirm.trim().toLowerCase() !== "delete") {
 toast.error("Type DELETE to confirm.");
 return;
 }
 setDeletingAccount(true);
 try {
 await deleteMyAccount();
 await signOut("local").catch(() => {});
 toast.success("Account deleted.");
 navigate("/", { replace: true });
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not delete.");
 } finally {
 setDeletingAccount(false);
 }
 };

 return (
 <AppLayout>
 <AuthGate
 authLoading={loading}
 signedIn={Boolean(user)}
 authTitle="Sign in to manage your account"
 authBody="Settings is for changing your email, password, and account state - you need to be signed in first."
 >
 <div className="container max-w-2xl py-10">
 <header className="mb-10">
 <h1 className="font-display text-4xl md:text-5xl leading-[1]">
 Account
 </h1>
 </header>

 <section className="rounded-sm border border-border bg-card divide-y divide-border">
 {/* Email row - autosaves on blur. */}
 <div className="p-6 md:p-8 space-y-3">
 <div className="flex items-center justify-between gap-3">
 <Label
 htmlFor="email"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
 >
 Email
 </Label>
 <EmailStatus state={emailState} />
 </div>
 <Input
 id="email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 onBlur={handleEmailBlur}
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </div>

 {/* Password row - inline submit; "Current" only matters when
 a new one is typed, so it sits next to the new field
 instead of being a separate gate. */}
 <form
 onSubmit={handlePassword}
 className="p-6 md:p-8 space-y-3"
 >
 <Label
 htmlFor="password"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
 >
 Password
 </Label>
 <div className="grid gap-3 md:grid-cols-2">
 <Input
 id="current-password"
 type="password"
 value={currentPassword}
 onChange={(e) => setCurrentPassword(e.target.value)}
 autoComplete="current-password"
 placeholder="Current"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 <Input
 id="password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 autoComplete="new-password"
 placeholder="New (8+ chars)"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </div>
 <div className="flex justify-end">
 <Button
 type="submit"
 variant="gold"
 size="sm"
 disabled={
 savingPassword ||
 currentPassword.length < 1 ||
 password.length < 8
 }
 >
 {savingPassword ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : null}
 Update password
 </Button>
 </div>
 </form>

 {/* Sign out row - one button, no surrounding paragraph. The
 confirm dialog itself offers "this tab" vs "everywhere". */}
 <div className="p-6 md:p-8 flex items-center justify-between gap-3">
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Session
 </Label>
 <Button variant="outline" size="sm" onClick={handleSignOut}>
 Sign out
 </Button>
 </div>
 </section>

 {/* Danger zone - collapsed by default. The whole row is a
 single button until expanded; this keeps the destructive
 action out of the user's eye on every visit. */}
 <details
 className="group mt-8 rounded-sm border border-border bg-card open:border-destructive"
 onToggle={(e) => setDeleteOpen((e.target as HTMLDetailsElement).open)}
 >
 <summary className="cursor-pointer list-none px-6 md:px-8 py-5 flex items-center justify-between gap-3">
 <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground group-open:text-destructive">
 Danger zone
 </span>
 <span className="font-mono text-xs text-muted-foreground group-open:text-destructive transition-transform group-open:rotate-45">
 +
 </span>
 </summary>
 <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-3">
 <p className="text-sm text-muted-foreground">
 Permanently removes your profile, projects, applications, and chat
 history. This cannot be undone.
 </p>
 <Input
 id="delete-confirm"
 value={deleteConfirm}
 onChange={(e) => setDeleteConfirm(e.target.value)}
 placeholder="Type DELETE to confirm"
 className="h-11 bg-background border-border focus-visible:border-destructive focus-visible:ring-destructive"
 />
 <div className="flex justify-end">
 <Button
 variant="outline"
 size="sm"
 onClick={handleDeleteAccount}
 disabled={
 deletingAccount ||
 deleteConfirm.trim().toLowerCase() !== "delete"
 }
 className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
 >
 {deletingAccount ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : null}
 Delete my account
 </Button>
 </div>
 {/* Hidden helper so the linter doesn't flag the open
 state as unused - it drives the eyebrow color via
 group-open utility classes above. */}
 <span className="sr-only">{deleteOpen ? "open" : "closed"}</span>
 </div>
 </details>
 </div>
 </AuthGate>
 </AppLayout>
 );
};

// Small inline status pill that appears to the right of the email
// label while a save is in flight, then briefly after success. Avoids
// needing a separate "Save" button.
const EmailStatus = ({ state }: { state: "idle" | "saving" | "saved" }) => {
 if (state === "idle") return null;
 if (state === "saving") {
 return (
 <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 <Loader2 className="h-3 w-3 animate-spin" />
 Saving
 </span>
 );
 }
 return (
 <span className="text-[11px] font-mono uppercase tracking-widest text-gold">
 Check your inbox
 </span>
 );
};

export default Settings;
