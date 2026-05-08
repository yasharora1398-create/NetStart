/**
 * Hidden post-verification landing — reached only by Supabase
 * redirecting here after a confirmation link is clicked, or by
 * typing /authenticated directly. Not linked from any nav.
 *
 * Supabase already created a session at verify-time, so the user is
 * now signed in. The card just confirms that and reminds them to go
 * fill out their MyNet. The CTA returns them to "/" (the homepage)
 * with the session intact, where they'll see the signed-in nav
 * (Sign out + Edit MyNet).
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const Authenticated = () => {
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
          Signed in
        </p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] text-foreground mb-4">
          You&apos;re in.
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
          Your account is verified and you&apos;re signed in. One thing
          left:{" "}
          <span className="text-foreground font-semibold">
            set up your MyNet
          </span>{" "}
          so we know who you are and what you&apos;re building.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/mynet"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            Set up MyNet
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Authenticated;
