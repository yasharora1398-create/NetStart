import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Sparkles, Zap } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { useAuth } from "@/context/AuthContext";

const WHY = [
  {
    icon: BadgeCheck,
    title: "Vetted, not viral.",
    body: "Every member reviewed for shipped work. No accounts farmed for engagement.",
  },
  {
    icon: Sparkles,
    title: "Matches ranked by AI.",
    body: "The deck is ordered against your skills, project, and intent. Not the algorithm's.",
  },
  {
    icon: Zap,
    title: "Decisive by design.",
    body: "Connect, save, or pass. No likes, no maybes. Apply with one real pitch.",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ overflowX: "clip" }}
    >
      <Sidebar />
      <div
        className="transition-[padding] duration-300"
        style={{ paddingLeft: "var(--sidebar-width, 248px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          {/* HERO */}
          <section className="pt-6 md:pt-12 pb-12 md:pb-16 max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] mb-5 text-primary">
              polln8 / for builders
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-[6rem] leading-[0.92] tracking-[-0.03em] mb-5 text-foreground font-bold">
              The mobile app for people who actually
              <span className="italic text-primary"> build.</span>
            </h1>
            <p className="text-base md:text-lg max-w-md mb-8 leading-relaxed text-muted-foreground">
              Vetted founders and operators. Matches ranked by AI. Connect, pass,
              or save. No maybes.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <Link to="/mynet">
                  <PrimaryButton>Open MyNet</PrimaryButton>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <PrimaryButton>Sign up free</PrimaryButton>
                  </Link>
                  <Link
                    to="/signin"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* WHY — three reasons in warm cards */}
          <section className="py-10 md:py-14">
            <div className="grid md:grid-cols-3 gap-4">
              {WHY.map((w) => {
                const Icon = w.icon;
                return (
                  <article
                    key={w.title}
                    className="glass relative p-6"
                    style={{ borderRadius: 16 }}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg mb-4 bg-primary/10 border border-primary/40 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-display text-xl mb-2 tracking-[-0.015em] text-foreground font-bold">
                      {w.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {w.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* HOW — single line flow */}
          <section className="py-10 md:py-14">
            <div className="grid md:grid-cols-[160px_1fr] gap-6 md:gap-12 items-baseline">
              <Link
                to="/how"
                className="group inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-primary transition-colors hover:opacity-80"
              >
                How it works
                <ArrowRight className="h-3 w-3 mt-0.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="font-display text-2xl md:text-4xl tracking-[-0.02em] leading-[1.15] max-w-3xl text-foreground font-bold">
                Sign up. Verify. Match.{" "}
                <span className="italic text-primary">Build.</span>
              </p>
            </div>
          </section>

          {/* CLOSING CTA — alt-section panel */}
          <section className="py-12 md:py-16">
            <div className="p-8 md:p-12 bg-secondary border border-border rounded-2xl">
              <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 items-end">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] mb-4 inline-flex items-center gap-2 text-primary">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                      style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.55)" }}
                    />
                    Apply to join
                  </p>
                  <h2 className="font-display text-3xl md:text-5xl tracking-[-0.025em] leading-[1] mb-3 text-foreground font-bold">
                    Operators,
                    <br />
                    <span className="italic text-muted-foreground">
                      not talkers.
                    </span>
                  </h2>
                  <p className="text-sm md:text-base max-w-md leading-relaxed text-muted-foreground">
                    Free to apply. Quick manual review.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 min-w-[220px]">
                  {user ? (
                    <Link to="/mynet">
                      <CtaButton primary label="Open MyNet" sub="Continue" />
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup">
                        <CtaButton
                          primary
                          label="Sign up free"
                          sub="Free to apply"
                        />
                      </Link>
                      <Link to="/download">
                        <CtaButton label="Get the app" sub="iOS & Android" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-4 mb-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] border-t border-border text-muted-foreground">
            <p>© Polln8</p>
            <div className="flex gap-6">
              <Link to="/how" className="transition-colors hover:text-foreground">
                How it works
              </Link>
              <Link
                to="/standards"
                className="transition-colors hover:text-foreground"
              >
                Standards
              </Link>
              <Link
                to="/download"
                className="transition-colors hover:text-foreground"
              >
                Download
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

const PrimaryButton = ({ children }: { children: React.ReactNode }) => (
  <button
    type="button"
    className="group inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90"
    style={{ boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)" }}
  >
    {children}
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </button>
);

const CtaButton = ({
  label,
  sub,
  primary = false,
}: {
  label: string;
  sub: string;
  primary?: boolean;
}) => (
  <span
    className={`group flex items-center gap-3 transition-all min-w-[220px] cursor-pointer rounded-lg ${
      primary
        ? "bg-primary text-primary-foreground px-5 py-3"
        : "bg-card text-foreground border-[1.5px] border-primary px-5 py-[10.5px]"
    }`}
    style={
      primary
        ? { boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)" }
        : undefined
    }
  >
    <span className="text-sm font-medium block flex-1">
      <span className="block leading-tight">{label}</span>
      <span className="block text-[10px] font-mono uppercase tracking-[0.18em] mt-0.5 opacity-65">
        {sub}
      </span>
    </span>
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </span>
);

export default Index;
