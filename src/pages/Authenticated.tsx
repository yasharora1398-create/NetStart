/**
 * Hidden post-verification landing — reached only by typing
 * /authenticated directly (or by Supabase redirecting here after a
 * confirmation link is clicked). Not linked from the waitlist or any
 * other surface.
 *
 * Supabase auto-creates a session when its /verify endpoint succeeds,
 * which would silently log the user in. We want the opposite: the
 * user should land here, see the confirmation, and then go sign in
 * themselves with the credentials they just made. So we drop any
 * session that's been set as soon as the page mounts.
 *
 * Same near-black background as the rest of the marketing site, with
 * two green glow orbs floating behind a centered card. The card
 * confirms the email is verified and points the user at /signin.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Authenticated = () => {
  const { signOut } = useAuth();
  useEffect(() => {
    // Drop the session Supabase auto-created at verify-time. We don't
    // wait on the promise — by the time the user reads the card and
    // clicks "Sign in," the sign-out has resolved and /signin won't
    // bounce them via its already-authed redirect.
    void signOut();
  }, [signOut]);

  return (
  <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
    {/* Blurred green orbs — mirror of the waitlist backdrop. */}
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

    {/* Centered confirmation card. */}
    <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-12">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card px-8 py-10 md:px-10 md:py-12 text-center"
        style={{ boxShadow: "var(--shadow-elite)" }}
      >
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 border border-primary/40 mb-6 mx-auto">
          <Check
            className="h-6 w-6 text-primary"
            strokeWidth={2.5}
          />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-3">
          Verified
        </p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] text-foreground mb-4">
          You&apos;re in.
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
          Your account is fully authenticated. Head back to the sign-in
          page and use the email and password you just created to access
          your Polln8 account.
        </p>
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </div>
  );
};

export default Authenticated;
