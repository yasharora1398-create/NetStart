"use client";
/**
 * Post-signup landing - shown after a user submits the SignUp form.
 * Replaces the old toast with a dedicated page that:
 *   • tells them the email was sent
 *   • shows the address it went to so they don't second-guess it
 *   • offers a "Resend email" button with a 60s cooldown so the
 *     button can't be spammed against Supabase's rate limits
 *   • has a quiet escape route back to the homepage
 *
 * The email address is passed via location.state from SignUp. If the
 * page is reached directly without state, we fall back to a generic
 * "your email" message and the resend button is hidden (we have
 * nothing to resend to).
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import { ArrowRight, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const RESEND_COOLDOWN_SECONDS = 60;

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resendVerification } = useAuth();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [resending, setResending] = useState(false);
  // Seconds remaining before the user can click Resend again. Starts
  // at 0 (button is enabled). After a successful resend we set it to
  // RESEND_COOLDOWN_SECONDS and tick down once a second.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    const { error } = await resendVerification(email);
    setResending(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("rate") || msg.includes("for security")) {
        toast.error("Too many requests. Wait a minute and try again.");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        toast.error(error.message || "Couldn't resend. Try again later.");
      }
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success("Sent. Check your inbox.");
  };

  const buttonLabel = resending
    ? "Sending..."
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : "Resend email";

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Same green orbs as the waitlist + /authenticated. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ filter: "blur(60px)" }}
      >
        <div
          className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.85) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full opacity-25"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.7) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-12">
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-card px-8 py-10 md:px-10 md:py-12 text-center"
          style={{ boxShadow: "var(--shadow-elite)" }}
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 border border-primary/40 mb-6 mx-auto">
            <MailCheck
              className="h-6 w-6 text-primary"
              strokeWidth={2.5}
            />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-3">
            Check your email
          </p>
          <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] text-foreground mb-4">
            We sent you a link.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-2">
            We just sent a confirmation email to{" "}
            <span className="text-foreground font-semibold break-all">
              {email || "your email"}
            </span>
            .
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
            Click the link in that email to confirm your account. If
            you don&apos;t see it in a minute or two, check your spam
            folder.
          </p>

          <div className="flex flex-col gap-3 items-center">
            {email && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                {resending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {buttonLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mt-2"
            >
              Back to homepage
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground border-t border-border pt-5 mt-8">
            Already verified?{" "}
            <Link
              to="/signin"
              className="text-primary transition-opacity hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;
