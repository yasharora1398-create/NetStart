"use client";
import { useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/netstart/Logo";
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
import { useAuth } from "@/context/AuthContext";
import { Turnstile } from "@/components/netstart/Turnstile";

const CAPTCHA_REQUIRED = Boolean(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});
type ForgotValues = z.infer<typeof schema>;

const friendlyError = (msg: string): string => {
  const lower = msg.toLowerCase();
  if (lower.includes("rate") || lower.includes("for security"))
    return "Too many requests. Wait a minute and try again.";
  if (lower.includes("network") || lower.includes("fetch"))
    return "Network error. Check your connection and try again.";
  if (lower.includes("smtp") || lower.includes("sending"))
    return "Couldn't send the reset email. Try again in a moment.";
  return msg;
};

import { useForceLightMode } from "@/hooks/useForceLightMode";

const ForgotPassword = () => {
  useForceLightMode();
  const { requestPasswordReset } = useAuth();
  const location = useLocation();
  // Pre-fill from SignIn's "Forgot?" link state if present.
  const initialEmail =
    (location.state as { email?: string } | null)?.email ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  };

  const form = useForm<ForgotValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: initialEmail },
    mode: "onBlur",
  });

  const onSubmit = async (values: ForgotValues) => {
    if (CAPTCHA_REQUIRED && !captchaToken) {
      toast.error("Complete the human-check below before sending.");
      return;
    }
    setSubmitting(true);
    const { error } = await requestPasswordReset(
      values.email,
      captchaToken ?? undefined,
    );
    setSubmitting(false);
    resetCaptcha();
    if (error) {
      toast.error(friendlyError(error.message));
      return;
    }
    // Supabase always succeeds for security (no enumeration). We
    // confirm visually regardless of whether the email actually
    // exists. Real users get the email; attackers get the same
    // success page and learn nothing.
    setSentTo(values.email.trim().toLowerCase());
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-6">
        <Link to="/" aria-label="Polln8 home">
          <Logo />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>

          {sentTo ? (
            <div className="rounded-sm border border-gold-soft bg-card p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 mb-4">
                <MailCheck className="h-5 w-5 text-gold" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
                Sent
              </p>
              <h1 className="font-display text-3xl mb-3">Check your inbox.</h1>
              <p className="text-sm text-muted-foreground mb-2">
                If an account exists for{" "}
                <span className="text-foreground">{sentTo}</span>, we sent a
                password reset link. The link expires in an hour.
              </p>
              <p className="text-xs text-muted-foreground/80 mt-4 mb-6">
                Don&apos;t see it? Check your spam folder.
              </p>
              <Link to="/signin">
                <Button variant="gold" size="lg" className="w-full h-12">
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
                Reset
              </p>
              <h1 className="font-display text-4xl leading-[1] mb-3">
                Forgot your password?
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                We&apos;ll email you a link to set a new one.
              </p>

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
                              autoFocus={!initialEmail}
                              placeholder="you@example.com"
                              className="h-12 bg-card border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
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
                        Sending...
                      </>
                    ) : (
                      <>
                        Send reset link
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
