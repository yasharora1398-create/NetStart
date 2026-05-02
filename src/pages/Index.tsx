import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Sparkles, Zap } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { useAuth } from "@/context/AuthContext";

const WHY = [
  {
    icon: BadgeCheck,
    title: "Vetted, not viral.",
    body: "Every member reviewed for shipped work. No engagement-farmed accounts.",
  },
  {
    icon: Sparkles,
    title: "AI-ranked matches.",
    body: "The deck is ordered against your skills, project, and intent — not the algorithm's.",
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
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-5">
              netstart / for builders
            </p>
            <h1
              className="text-4xl md:text-6xl lg:text-[6rem] leading-[0.92] tracking-[-0.04em] mb-5"
              style={{ fontWeight: 600 }}
            >
              The mobile app for people who actually
              <span className="text-blue-400"> build.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
              Vetted founders and operators. AI-ranked matches. Connect, pass,
              or save — no maybes.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-10">
              {user ? (
                <Link to="/mynet">
                  <PrimaryButton>Open MyNet</PrimaryButton>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <PrimaryButton>Sign up free</PrimaryButton>
                  </Link>
                  <Link to="/signin" className={MUTE_LINK}>
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                <span className="text-foreground">2,840</span> verified
              </span>
              <span>
                <span className="text-foreground">312</span> companies
              </span>
              <span>
                <span className="text-foreground">&lt; 24h</span> review
              </span>
            </div>
          </section>

          {/* WHY — three reasons in glass cards */}
          <section className="py-10 md:py-14">
            <div className="grid md:grid-cols-3 gap-3">
              {WHY.map((w) => {
                const Icon = w.icon;
                return (
                  <div
                    key={w.title}
                    className="glass rounded-2xl p-6"
                    style={{
                      fontFamily:
                        "'Geist', ui-sans-serif, system-ui, sans-serif",
                    }}
                  >
                    <div
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl mb-4"
                      style={{
                        background: "rgba(58,123,255,0.10)",
                        border: "0.5px solid rgba(58,123,255,0.35)",
                        color: "#5b95ff",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3
                      className="text-xl mb-2 tracking-[-0.02em]"
                      style={{ fontWeight: 600 }}
                    >
                      {w.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {w.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* HOW — single line flow */}
          <section className="py-10 md:py-14">
            <div className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 items-baseline">
              <Link
                to="/how"
                className="group inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 hover:text-blue-300 transition-colors"
              >
                How it works
                <ArrowRight className="h-3 w-3 mt-0.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p
                className="text-2xl md:text-4xl tracking-[-0.03em] leading-[1.15] max-w-3xl"
                style={{ fontWeight: 600 }}
              >
                Sign up. Verify. Match.{" "}
                <span className="text-blue-400">Build.</span>
              </p>
            </div>
          </section>

          {/* CLOSING CTA — frosted glass card */}
          <section className="py-12 md:py-16">
            <div
              className="glass rounded-2xl p-8 md:p-12"
              style={{
                fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
              }}
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 items-end">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-4 inline-flex items-center gap-2">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background: "#3a7bff",
                        boxShadow: "0 0 8px rgba(58,123,255,0.55)",
                      }}
                    />
                    Apply to join
                  </p>
                  <h2
                    className="text-3xl md:text-5xl tracking-[-0.04em] leading-[1] mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    Operators,
                    <br />
                    <span className="text-muted-foreground">not talkers.</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
                    Free to apply. Verification is usually under 24 hours.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 min-w-[220px]">
                  {user ? (
                    <Link to="/mynet">
                      <DownloadButton primary label="Open MyNet" sub="Continue" />
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup">
                        <DownloadButton
                          primary
                          label="Sign up free"
                          sub="Takes 2 minutes"
                        />
                      </Link>
                      <Link to="/download">
                        <DownloadButton label="Get the app" sub="iOS & Android" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/10 mt-4 mb-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <p>© netstart</p>
            <div className="flex gap-6">
              <Link to="/how" className="hover:text-foreground transition-colors">
                How it works
              </Link>
              <Link
                to="/standards"
                className="hover:text-foreground transition-colors"
              >
                Standards
              </Link>
              <Link
                to="/download"
                className="hover:text-foreground transition-colors"
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

const MUTE_LINK =
  "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";

const PrimaryButton = ({ children }: { children: React.ReactNode }) => (
  <button
    type="button"
    className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all"
    style={{
      background: "linear-gradient(180deg, #4a86ff 0%, #2f6fff 100%)",
      color: "#fff",
      boxShadow:
        "0 1px 0 rgba(255,255,255,0.25) inset, 0 -8px 16px rgba(0,0,0,0.18) inset, 0 6px 20px rgba(58,123,255,0.35), 0 1px 2px rgba(0,0,0,0.4)",
      fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
    }}
  >
    {children}
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </button>
);

const DownloadButton = ({
  label,
  sub,
  primary = false,
}: {
  label: string;
  sub: string;
  primary?: boolean;
}) => (
  <span
    className="group flex items-center gap-3 rounded-xl px-5 py-3 transition-all min-w-[220px] cursor-pointer"
    style={
      primary
        ? {
            background: "linear-gradient(180deg, #4a86ff 0%, #2f6fff 100%)",
            color: "#fff",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.25) inset, 0 -8px 16px rgba(0,0,0,0.18) inset, 0 6px 20px rgba(58,123,255,0.35), 0 1px 2px rgba(0,0,0,0.4)",
          }
        : {
            background: "rgba(255,255,255,0.04)",
            color: "#eef1f6",
            border: "0.5px solid rgba(255,255,255,0.14)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset",
          }
    }
  >
    <span
      className="text-sm font-medium block flex-1"
      style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif" }}
    >
      <span className="block leading-tight">{label}</span>
      <span
        className="block text-[10px] font-mono uppercase tracking-[0.18em] opacity-60 mt-0.5"
        style={{
          fontFamily:
            "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {sub}
      </span>
    </span>
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </span>
);

export default Index;
