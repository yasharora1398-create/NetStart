"use client";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
 AlertCircle,
 ArrowRight,
 Eye,
 EyeOff,
 Loader2,
 Sparkles,
} from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Logo } from "@/components/netstart/Logo";
import { useAuth } from "@/context/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { signInSchema, type SignInValues } from "@/lib/auth-schemas";
import { Turnstile } from "@/components/netstart/Turnstile";
import heroBg from "@/assets/hero-bg.jpg";
import { assetUrl } from "@/lib/asset-url";

const CAPTCHA_REQUIRED = Boolean(
 process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);

// Map every Supabase signin error we've seen to a human-readable line.
// Falls through to the SDK message for anything new.
const friendlySignInError = (
 err: AuthError | Error,
): { message: string; needsConfirmation?: boolean } => {
 const msg = err.message.toLowerCase();
 if (msg.includes("invalid login") || msg.includes("invalid credentials"))
 return { message: "Incorrect email or password." };
 if (msg.includes("email not confirmed"))
 return {
 message:
 "Confirm your email first. Check your inbox for the verification link.",
 needsConfirmation: true,
 };
 if (msg.includes("rate limit") || msg.includes("too many"))
 return { message: "Too many attempts. Wait a minute and try again." };
 if (msg.includes("network") || msg.includes("fetch"))
 return {
 message: "Network error. Check your connection and try again.",
 };
 return { message: err.message };
};

import { useForceLightMode } from "@/hooks/useForceLightMode";

const SignIn = () => {
 useForceLightMode();
 usePageMeta({
 title: "Sign In to Polln8 | Find a Cofounder or a Startup",
 description:
 "Sign in to Polln8 to view your cofounder matches and startup matches, send pitches, and message your network of vetted founders and partners.",
 path: "/signin",
 });
 const { signIn, user, loading } = useAuth();
 const navigate = useNavigate();
 const location = useLocation();
 const [submitting, setSubmitting] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const [capsLock, setCapsLock] = useState(false);
 // Inline banner for "email not confirmed" - gives the user a path
 // back to the verification email instead of a transient toast.
 const [needsConfirmation, setNeedsConfirmation] = useState<string | null>(
 null,
 );
 // Turnstile token. Required when CAPTCHA env var is set.
 const [captchaToken, setCaptchaToken] = useState<string | null>(null);
 const [captchaNonce, setCaptchaNonce] = useState(0);
 const resetCaptcha = () => {
 setCaptchaToken(null);
 setCaptchaNonce((n) => n + 1);
 };

 const form = useForm<SignInValues>({
 resolver: zodResolver(signInSchema),
 defaultValues: { email: "", password: "" },
 mode: "onBlur",
 });

 // Sign-in lands on /mynet so already-signed-in users who click the
 // homepage Sign in CTA don't bounce back home. The location.state.from
 // value is preserved on the "Create an account" link below for users
 // who pivot to signup.
 const redirectTo = "/mynet";
 const fromState = (location.state as { from?: string } | null)?.from ?? "/mynet";

 useEffect(() => {
 if (!loading && user) navigate(redirectTo, { replace: true });
 }, [loading, user, navigate]);

 // Don't flash the form for an already-authed user.
 if (loading || user) return null;

 const onSubmit = async (values: SignInValues) => {
 if (CAPTCHA_REQUIRED && !captchaToken) {
 toast.error("Complete the human-check below before signing in.");
 return;
 }
 setNeedsConfirmation(null);
 setSubmitting(true);
 const { error } = await signIn(
 values.email,
 values.password,
 captchaToken ?? undefined,
 );
 setSubmitting(false);
 resetCaptcha();

 if (error) {
 const friendly = friendlySignInError(error);
 if (friendly.needsConfirmation) {
 setNeedsConfirmation(values.email.trim().toLowerCase());
 }
 toast.error(friendly.message);
 return;
 }

 toast.success("Welcome back.");
 navigate(redirectTo, { replace: true });
 };

 const onPasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (typeof e.getModifierState === "function") {
 setCapsLock(e.getModifierState("CapsLock"));
 }
 };

 return (
 <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_1fr]">
 {/* Brand panel */}
 <aside className="hidden lg:flex relative flex-col justify-between p-12 border-r border-gold overflow-hidden">
 <div
 className="absolute inset-0 -z-10 "
 style={{
 backgroundImage: `url(${assetUrl(heroBg)})`,
 backgroundSize: "cover",
 backgroundPosition: "center",
 maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
 }}
 />
 <div className="absolute inset-0 -z-10 bg-gradient-spotlight " />

 <Link to="/" aria-label="Polln8 home" className="relative z-10">
 <Logo />
 </Link>

 <div className="relative z-10 max-w-md">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold bg-gold mb-8">
 <Sparkles className="h-3 w-3 text-white" />
 <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white">
 Welcome back
 </span>
 </div>
 <h2 className="font-display text-5xl leading-[0.95] mb-8">
 Work with partners,<br />
 <em className="text-gradient-gold not-italic">not talkers.</em>
 </h2>
 </div>

 <p className="relative z-10 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 © Polln8 · A network for partners
 </p>
 </aside>

 {/* Form panel */}
 <main className="flex flex-col">
 <header className="lg:hidden border-b border-gold">
 <div className="container h-16 flex items-center">
 <Link to="/" aria-label="Back to home">
 <Logo />
 </Link>
 </div>
 </header>

 <div className="flex-1 flex items-center justify-center px-6 py-16">
 <div className="w-full max-w-md">
 <div className="mb-10">
 <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-4">
 Sign in
 </p>
 <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
 Pick up where<br />you left off.
 </h1>
 <p className="text-muted-foreground text-sm">
 Continue building with the partners in your network.
 </p>
 </div>

 {/* "Confirm your email" banner - appears when login is
 rejected because the address is unconfirmed. */}
 {needsConfirmation && (
 <div className="mb-6 flex items-start gap-3 rounded-sm border border-gold bg-gold p-4">
 <AlertCircle className="h-4 w-4 text-white flex-shrink-0 mt-0.5" />
 <div className="flex-1 text-sm">
 <p className="text-foreground font-medium mb-1">
 Confirm your email first.
 </p>
 <p className="text-muted-foreground">
 Open the verification link we sent to {needsConfirmation},
 or{" "}
 <Link
 to="/check-email"
 state={{ email: needsConfirmation }}
 className="text-gold hover:underline"
 >
 resend it
 </Link>
 {"."}
 </p>
 </div>
 </div>
 )}

 <Form {...form}>
 <form
 onSubmit={form.handleSubmit(onSubmit)}
 className="space-y-5"
 noValidate
 >
 <fieldset disabled={submitting} className="space-y-5">
 <FormField
 control={form.control}
 name="email"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Email
 </FormLabel>
 <FormControl>
 <Input
 type="email"
 autoComplete="email"
 inputMode="email"
 placeholder="you@company.com"
 className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold"
 {...field}
 onChange={(e) => {
 field.onChange(e);
 if (needsConfirmation) {
 setNeedsConfirmation(null);
 }
 }}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="password"
 render={({ field }) => (
 <FormItem>
 <div className="flex items-center justify-between">
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Password
 </FormLabel>
 <Link
 to="/forgot-password"
 state={{ email: form.getValues("email") }}
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
 >
 Forgot?
 </Link>
 </div>
 <FormControl>
 <div className="relative">
 <Input
 type={showPassword ? "text" : "password"}
 autoComplete="current-password"
 placeholder="Your password"
 className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold pr-12"
 {...field}
 onKeyUp={onPasswordKey}
 onKeyDown={onPasswordKey}
 />
 <button
 type="button"
 onClick={() => setShowPassword((v) => !v)}
 tabIndex={-1}
 aria-label={
 showPassword ? "Hide password" : "Show password"
 }
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 >
 {showPassword ? (
 <EyeOff className="h-4 w-4" />
 ) : (
 <Eye className="h-4 w-4" />
 )}
 </button>
 </div>
 </FormControl>
 <FormMessage />
 {capsLock && (
 <p className="flex items-center gap-1.5 text-[11px] text-gold mt-2">
 <AlertCircle className="h-3 w-3" />
 Caps Lock is on.
 </p>
 )}
 </FormItem>
 )}
 />
 </fieldset>

 {CAPTCHA_REQUIRED && (
 <div className="flex justify-center">
 <Turnstile
 key={captchaNonce}
 onVerify={(t) => setCaptchaToken(t)}
 onExpire={resetCaptcha}
 onError={resetCaptcha}
 />
 </div>
 )}

 <Button
 type="submit"
 variant="gold"
 size="lg"
 className="w-full h-12 group"
 disabled={
 submitting || (CAPTCHA_REQUIRED && !captchaToken)
 }
 >
 {submitting ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Signing in...
 </>
 ) : (
 <>
 Sign in
 <ArrowRight className="transition-transform group-hover:translate-x-1" />
 </>
 )}
 </Button>
 </form>
 </Form>

 <div className="relative my-10">
 <div className="absolute inset-0 flex items-center">
 <span className="w-full border-t border-border" />
 </div>
 <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-widest">
 <span className="bg-background px-3 text-muted-foreground">
 New here
 </span>
 </div>
 </div>

 <Link to="/signup" state={{ from: fromState }}>
 <Button variant="outlineGold" size="lg" className="w-full h-12">
 Create an account
 </Button>
 </Link>
 </div>
 </div>
 </main>
 </div>
 );
};

export default SignIn;
