"use client";
/**
 * Hidden post-verification landing — reached only by Supabase
 * redirecting here after a confirmation link is clicked. Supabase
 * already created a session at verify-time so the user is now
 * signed in.
 *
 * The combined sign-up + setup flow needs people to land directly
 * in MyNet without an extra "click here to set up" step. We show a
 * brief "you're in" splash then auto-redirect to /mynet so the
 * wizard runs end-to-end. Anyone hitting /authenticated without a
 * session falls back to /signin.
 */
import { useEffect } from "react";
import { Navigate, useNavigate } from "@/lib/router-compat";
import { Check, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const Authenticated = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    // Brief visual confirmation that the verify worked, then forward
    // straight into the setup wizard. 600ms is enough to register
    // the green checkmark; longer just feels slow.
    const id = setTimeout(() => navigate("/mynet", { replace: true }), 600);
    return () => clearTimeout(id);
  }, [loading, user, navigate]);

  if (!loading && !user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ filter: "blur(60px)" }}
      >
        <div
          className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full opacity-[0.10]"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full opacity-[0.08]"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-12">
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-card px-8 py-10 md:px-10 md:py-12 text-center"
          style={{ boxShadow: "var(--shadow-elite)" }}
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 border border-primary/40 mb-6 mx-auto">
            <Check className="h-6 w-6 text-primary" strokeWidth={2.5} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-3">
            Verified
          </p>
          <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] text-foreground mb-4">
            You're in.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
            Taking you to set up your profile...
          </p>
          <Loader2 className="h-4 w-4 text-primary animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default Authenticated;
