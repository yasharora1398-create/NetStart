"use client";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Check,
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
import { signUpSchema, type SignUpValues } from "@/lib/auth-schemas";
import { trackSignupCompleted } from "@/lib/analytics";
import { Turnstile } from "@/components/netstart/Turnstile";

// Whether to render the Turnstile widget at all. If the site-key env
// var is absent (local dev without it set) we skip the widget so
// devs aren't blocked. Production builds always have the key set.
const CAPTCHA_REQUIRED = Boolean(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);
import heroBg from "@/assets/hero-bg.jpg";
import { assetUrl } from "@/lib/asset-url";

// Map every Supabase signup error we've seen in production to a
// human-readable line. Keeps the actual SDK message as fallback so
// new error types don't render as nothing.
const friendlySignUpError = (err: AuthError | Error): string => {
  const msg = err.message.toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists"))
    return "An account with that email already exists. Sign in instead.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Wait a minute and try again.";
  if (msg.includes("password should be") || msg.includes("weak password"))
    return "Password is too weak. Use 8+ characters with upper, lower, and a number.";
  if (msg.includes("invalid email") || msg.includes("email address"))
    return "Enter a valid email address.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Network error. Check your connection and try again.";
  if (msg.includes("smtp") || msg.includes("sending"))
    return "We couldn't send the verification email. Try again in a moment.";
  return err.message;
};

import { useForceLightMode } from "@/hooks/useForceLightMode";

const SignUp = () => {
  useForceLightMode();
  usePageMeta({
    title: "Sign Up | Cofounders found efficiently",
    description:
      "Create a Polln8 account in a minute. Match with vetted technical cofounders and founding engineers, or find an early-stage startup worth joining. Free during early access.",
    path: "/signup",
  });
  const { signUp, user, loading, emailVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  // Surfaced inline above the form when Supabase tells us the email
  // already has an account (or its enumeration-protection signature
  // says so). More discoverable than a transient toast.
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  // Turnstile token (Cloudflare CAPTCHA). Cleared after each submit
  // because Turnstile tokens are single-use; if Supabase rejects the
  // signup the user has to re-solve before retrying.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bump to force-remount Turnstile on token reset (the widget
  // doesn't expose a clean "issue new token" hook).
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  };

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", role: undefined },
    // Validate on blur so users see field-level errors as they tab
    // through, not all at once on submit.
    mode: "onBlur",
  });

  // If an already-authed user lands on /signup, route them away.
  // - Unverified users go to /check-email so they finish verification
  //   before they can fill out the wizard with an unconfirmed address.
  // - Verified users go to /mynet (same policy as sign-in). Avoids the
  //   bounce-back-to-home loop that hit users clicking homepage CTAs
  //   when they were already signed in.
  const fromState = (location.state as { from?: string } | null)?.from ?? "/mynet";

  useEffect(() => {
    if (loading || !user) return;
    if (!emailVerified) {
      navigate("/check-email", {
        replace: true,
        state: { email: user.email ?? "" },
      });
      return;
    }
    navigate(fromState, { replace: true });
  }, [loading, user, emailVerified, navigate, fromState]);

  // Don't flash the form for an already-authed user. The redirect
  // above runs in an effect, so without this guard the form mounts
  // for a frame before unmounting.
  if (loading || user) return null;

  const onSubmit = async (values: SignUpValues) => {
    if (CAPTCHA_REQUIRED && !captchaToken) {
      toast.error("Complete the human-check below before submitting.");
      return;
    }
    setDuplicateEmail(null);
    setSubmitting(true);
    const { error, duplicate } = await signUp(
      values.email,
      values.password,
      values.name,
      values.role,
      captchaToken ?? undefined,
    );
    setSubmitting(false);
    // Always burn the token after a submit attempt -- Turnstile
    // tokens are single-use either way.
    resetCaptcha();

    if (error) {
      toast.error(friendlySignUpError(error));
      return;
    }

    if (duplicate) {
      // Surface inline near the email field so the user can act
      // (sign in, recover password, or check their inbox).
      setDuplicateEmail(values.email.trim().toLowerCase());
      form.setError("email", {
        type: "manual",
        message: "An account with this email already exists.",
      });
      return;
    }

    // Funnel event: top of the conversion funnel. Email isn't
    // verified yet, but the signup form was submitted successfully.
    trackSignupCompleted(values.role);

    navigate("/check-email", {
      replace: true,
      state: { email: values.email.trim().toLowerCase() },
    });
  };

  // Caps Lock detection on the password field - common UX nicety
  // that catches typing-the-wrong-password-because-Caps-Lock-is-on.
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
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage: `url(${assetUrl(heroBg)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-spotlight opacity-60" />

        <Link to="/" aria-label="Polln8 home" className="relative z-10">
          <Logo />
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-5xl leading-[0.95] mb-8">
            For people who<br />
            <em className="text-gradient-gold not-italic">actually</em> build.
          </h2>
        </div>

        <p className="relative z-10 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          Â© Polln8 Â· A network for builders
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
                Create account
              </p>
              <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
                Start building<br />today.
              </h1>
              <p className="text-muted-foreground text-sm">
                Takes a minute. Confirmation sent to your inbox.
              </p>
            </div>

            {/* Duplicate-email banner - shown above the form so it's
                impossible to miss after a phantom-success signup. */}
            {duplicateEmail && (
              <div className="mb-6 flex items-start gap-3 rounded-sm border border-gold bg-gold p-4">
                <AlertCircle className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="text-foreground font-medium mb-1">
                    {duplicateEmail} is already registered.
                  </p>
                  <p className="text-muted-foreground">
                    <Link
                      to="/signin"
                      state={{ from: fromState }}
                      className="text-gold hover:underline"
                    >
                      Sign in
                    </Link>
                    {" or "}
                    <Link
                      to="/forgot-password"
                      className="text-gold hover:underline"
                    >
                      reset your password
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                          Full name
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            autoComplete="name"
                            placeholder="Your name"
                            className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold/20"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Clear the duplicate banner the moment
                              // they edit the email.
                              if (duplicateEmail) setDuplicateEmail(null);
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
                        <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="At least 8 characters"
                              className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold/20 pr-12"
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
                        <p className="text-[11px] text-muted-foreground/80 mt-2">
                          Use 8+ characters with upper, lower, and a number.
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                          What brings you here?
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            {(
                              [
                                {
                                  value: "founder",
                                  label: "I'm a founder",
                                  hint: "Building something. Need builders.",
                                },
                                {
                                  value: "builder",
                                  label: "I'm a builder",
                                  hint: "Looking for a project to join.",
                                },
                              ] as const
                            ).map((opt) => {
                              const active = field.value === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => field.onChange(opt.value)}
                                  className={`text-left rounded-sm border p-3 transition-colors ${
                                    active
                                      ? "border-gold bg-gold"
                                      : "border-border bg-card hover:border-gold"
                                  }`}
                                >
                                  <p
                                    className={`font-display text-base mb-1 ${
                                      active ? "text-gold" : "text-foreground"
                                    }`}
                                  >
                                    {opt.label}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground leading-snug">
                                    {opt.hint}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>

                {/* Cloudflare Turnstile. In "Managed" mode this is
                    usually invisible to humans; bots get challenged.
                    The token is required to submit; resetCaptcha()
                    runs after every submit attempt so a rejected
                    signup can get a fresh token without page reload. */}
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Already have an account?{" "}
              <Link
                to="/signin"
                state={{ from: fromState }}
                className="text-gold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
