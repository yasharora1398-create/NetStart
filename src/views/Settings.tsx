"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import {
 Loader2,
 LogOut,
 Mail,
 Save,
 Settings as SettingsIcon,
 ShieldCheck,
 Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { deleteMyAccount } from "@/lib/mynet-storage";
import { useConfirmSignOut } from "@/components/netstart/SignOutConfirm";

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
 const [password, setPassword] = useState("");
 const [savingEmail, setSavingEmail] = useState(false);
 const [savingPassword, setSavingPassword] = useState(false);
 const [deletingAccount, setDeletingAccount] = useState(false);
 const [deleteConfirm, setDeleteConfirm] = useState("");

 useEffect(() => {
 if (user?.email) setEmail(user.email);
 }, [user?.email]);

 const handleEmail = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email.trim() || email === user?.email) return;
 setSavingEmail(true);
 try {
 const { error } = await updateEmail(email.trim());
 if (error) toast.error(error.message);
 else toast.success("Confirm via the link in your inbox to finalize.");
 } finally {
 setSavingEmail(false);
 }
 };

 const handlePassword = async (e: React.FormEvent) => {
 e.preventDefault();
 if (password.length < 8) {
 toast.error("Password must be at least 8 characters.");
 return;
 }
 setSavingPassword(true);
 try {
 const { error } = await updatePassword(password);
 if (error) toast.error(error.message);
 else {
 toast.success("Password updated.");
 setPassword("");
 }
 } finally {
 setSavingPassword(false);
 }
 };

 // The shared confirm-sign-out dialog presents both scopes (this tab
 // / everywhere) inside itself, so this page just opens the dialog
 // and lets the user pick.
 const handleSignOut = () => confirmSignOut();

 const handleDeleteAccount = async () => {
 if (deleteConfirm.trim().toLowerCase() !== "delete") {
 toast.error("Type DELETE to confirm.");
 return;
 }
 if (
 !window.confirm(
 "Permanently delete your account? This wipes your profile, projects, applications, and chat history. It cannot be undone.",
 )
 ) {
 return;
 }
 setDeletingAccount(true);
 try {
 await deleteMyAccount();
 // The auth user is gone; the local session is now invalid.
 // Sign out clears the cached token before we redirect.
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
 <header className="mb-8">
 <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-gold bg-gold px-3 py-1.5">
 <SettingsIcon className="size-3 text-white" />
 <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
 Settings
 </span>
 </div>
 <h1 className="font-display text-4xl md:text-5xl leading-[1]">
 Account.
 </h1>
 <p className="mt-3 text-sm text-muted-foreground max-w-md">
 Email, password, session, and the permanent-delete control all
 live here.
 </p>
 </header>

 <section className="rounded-sm border border-border bg-card overflow-hidden mb-6">
 <form onSubmit={handleEmail} className="p-6 md:p-8 space-y-4">
 <div>
 <h2 className="font-display text-2xl mb-1 flex items-center gap-2">
 <Mail className="h-5 w-5 text-gold" />
 Email
 </h2>
 <p className="text-sm text-muted-foreground">
 Changes require confirmation from the new address.
 </p>
 </div>
 <div>
 <Label
 htmlFor="email"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
 >
 Email
 </Label>
 <Input
 id="email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="mt-2 h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </div>
 <Button
 type="submit"
 variant="gold"
 size="sm"
 disabled={savingEmail || email === user?.email || !email.trim()}
 >
 {savingEmail ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Save className="h-4 w-4" />
 )}
 Update email
 </Button>
 </form>
 </section>

 <section className="rounded-sm border border-border bg-card overflow-hidden mb-6">
 <form onSubmit={handlePassword} className="p-6 md:p-8 space-y-4">
 <div>
 <h2 className="font-display text-2xl mb-1 flex items-center gap-2">
 <ShieldCheck className="h-5 w-5 text-gold" />
 Password
 </h2>
 <p className="text-sm text-muted-foreground">
 At least 8 characters.
 </p>
 </div>
 <div>
 <Label
 htmlFor="password"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
 >
 New password
 </Label>
 <Input
 id="password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 autoComplete="new-password"
 className="mt-2 h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </div>
 <Button
 type="submit"
 variant="gold"
 size="sm"
 disabled={savingPassword || password.length < 8}
 >
 {savingPassword ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Save className="h-4 w-4" />
 )}
 Update password
 </Button>
 </form>
 </section>

 <section className="rounded-sm border border-border bg-card overflow-hidden mb-6">
 <div className="p-6 md:p-8 space-y-4">
 <div>
 <h2 className="font-display text-2xl mb-1 flex items-center gap-2">
 <LogOut className="h-5 w-5 text-gold" />
 Sessions
 </h2>
 <p className="text-sm text-muted-foreground">
 You can sign out of this tab only, or sign out from every
 device tied to your account.
 </p>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={handleSignOut}
 className="self-start"
 >
 <LogOut className="h-4 w-4" />
 Sign out
 </Button>
 </div>
 </section>

 <section className="rounded-sm border border-destructive bg-card overflow-hidden">
 <div className="p-6 md:p-8 space-y-4">
 <div>
 <h2 className="font-display text-2xl mb-1 flex items-center gap-2">
 <Trash2 className="h-5 w-5 text-destructive" />
 Delete account
 </h2>
 <p className="text-sm text-muted-foreground">
 Permanently removes your profile, projects, applications,
 and chat history. This cannot be undone.
 </p>
 </div>
 <div>
 <Label
 htmlFor="delete-confirm"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
 >
 Type DELETE to confirm
 </Label>
 <Input
 id="delete-confirm"
 value={deleteConfirm}
 onChange={(e) => setDeleteConfirm(e.target.value)}
 placeholder="DELETE"
 className="mt-2 h-11 bg-background border-border focus-visible:border-destructive focus-visible:ring-destructive"
 />
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={handleDeleteAccount}
 disabled={
 deletingAccount ||
 deleteConfirm.trim().toLowerCase() !== "delete"
 }
 className="border-destructive text-destructive hover:bg-destructive hover:text-destructive"
 >
 {deletingAccount ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Trash2 className="h-4 w-4" />
 )}
 Delete my account
 </Button>
 </div>
 </section>
 </div>
 </AuthGate>
 </AppLayout>
 );
};

export default Settings;
