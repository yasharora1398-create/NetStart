import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthGateProps = {
  title?: string;
  body?: string;
};

export const AuthGate = ({
  title = "This is for members only.",
  body = "Sign in or create an account to use MyNet, save people, and run searches against your network.",
}: AuthGateProps) => {
  const location = useLocation();
  const from = location.pathname + location.search;

  // Some pages (like /mynet in production) don't render a sidebar, so
  // hard-coding `left: var(--sidebar-width, 248px)` would float the
  // modal with a 248-px empty bar on the left. Detect at runtime
  // whether the var is actually set by reading the computed style on
  // <html>; if the document never set the variable we fall back to a
  // full-width centered modal.
  const [hasSidebar, setHasSidebar] = useState(false);
  useEffect(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--sidebar-width")
      .trim();
    setHasSidebar(value.length > 0 && value !== "0px");
  }, []);

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-30 flex items-center justify-center px-4"
      style={hasSidebar ? { left: "var(--sidebar-width)" } : { left: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      {/* Blurred backdrop - only blurs the content area, never the
          sidebar. Sits behind the modal card. */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        aria-hidden
      />

      {/* The card itself is fully opaque (bg-card) and sits above the
          backdrop in z-order, so it always renders sharp regardless of
          what's behind it. */}
      <div className="relative z-10 w-full max-w-md rounded-sm border border-gold-soft bg-card shadow-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-spotlight opacity-60 pointer-events-none" />
        <div className="relative p-8 md:p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-6">
            <Lock className="h-3 w-3 text-gold" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
              Members only
            </span>
          </div>

          <h2
            id="auth-gate-title"
            className="font-display text-3xl md:text-4xl leading-[1] mb-4"
          >
            {title}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {body}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/signin" state={{ from }} className="flex-1">
              <Button variant="outlineGold" size="lg" className="w-full h-12">
                Sign in
              </Button>
            </Link>
            <Link to="/signup" state={{ from }} className="flex-1">
              <Button variant="gold" size="lg" className="w-full h-12">
                Sign up
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-8 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-gold" />
            Vetted builders only
          </div>
        </div>
      </div>
    </div>
  );
};
