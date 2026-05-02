import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const PRINCIPLES = [
  {
    title: "Vetted, not viral.",
    body: "Members are reviewed for shipped work and execution.",
  },
  {
    title: "Skill, not surface.",
    body: "Matched on capability, not background or city.",
  },
  {
    title: "Decisive by design.",
    body: "Connect, pass, or save. No likes. No maybes.",
  },
];

const STEPS = [
  { n: "01", title: "Sign up", body: "Builder or Visionary." },
  { n: "02", title: "Add credentials", body: "LinkedIn, resume, or both." },
  { n: "03", title: "Get verified", body: "Quick vet for shipped work." },
  { n: "04", title: "Match", body: "Browse profiles. Connect or pass." },
  { n: "05", title: "Build", body: "Align fast. Ship together." },
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
        style={{ paddingLeft: "var(--sidebar-width, 240px)" }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          {/* HERO */}
          <section className="pt-20 pb-16 md:pt-28 md:pb-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-5">
              NetStart · for builders
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.75rem] leading-[0.95] tracking-tight mb-5">
              The mobile app for people who actually build.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              A network for founders and operators who ship. Verified. Decisive.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-10">
              {user ? (
                <Link to="/mynet">
                  <GlassButton primary>
                    Open MyNet
                    <ArrowRight className="h-4 w-4" />
                  </GlassButton>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <GlassButton primary>
                      Sign up
                      <ArrowRight className="h-4 w-4" />
                    </GlassButton>
                  </Link>
                  <Link to="/signin">
                    <GlassButton>Sign in</GlassButton>
                  </Link>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                <span className="text-foreground">2,840</span> verified
              </span>
              <span>
                <span className="text-foreground">312</span> companies started
              </span>
            </div>
          </section>

          {/* STANDARDS */}
          <section id="standards" className="py-12 md:py-16">
            <div className="flex items-baseline justify-between mb-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400">
                Standards
              </p>
              <h2 className="font-display text-2xl md:text-4xl tracking-tight">
                What we believe.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {PRINCIPLES.map((p, i) => (
                <div key={p.title} className={GLASS_CARD}>
                  <div className="font-mono text-xs text-blue-400 mb-3 tracking-[0.25em]">
                    0{i + 1}
                  </div>
                  <h3 className="font-display text-xl md:text-2xl mb-2 tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* HOW */}
          <section id="how" className="py-12 md:py-16">
            <div className="flex items-baseline justify-between mb-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400">
                How it works
              </p>
              <h2 className="font-display text-2xl md:text-4xl tracking-tight">
                Signup to shipping.
              </h2>
            </div>
            <ol className="space-y-2">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className={`${GLASS_CARD} flex items-baseline gap-5`}
                >
                  <span className="font-mono text-xs text-blue-400 tracking-[0.25em] flex-shrink-0">
                    {s.n}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-display text-xl mb-0.5 tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* DOWNLOAD */}
          <section id="download" className="py-16 md:py-24">
            <div className={`${GLASS_CARD} text-center md:text-left md:flex md:items-center md:justify-between md:gap-8 !p-8 md:!p-12`}>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-3">
                  Download
                </p>
                <h2 className="font-display text-3xl md:text-5xl tracking-tight mb-2">
                  Operators, not talkers.
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Available on iOS and Android.
                </p>
              </div>
              <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-3 justify-center">
                <GlassButton primary>
                  iOS
                  <ArrowRight className="h-4 w-4" />
                </GlassButton>
                <GlassButton>Android</GlassButton>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/10 mt-8 mb-6 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <p>© NetStart</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Manifesto
              </a>
              <a href="#standards" className="hover:text-foreground transition-colors">
                Standards
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

const GLASS_CARD =
  "rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 md:p-6 hover:bg-white/[0.05] hover:border-white/20 transition-colors";

const GlassButton = ({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) => (
  <button
    type="button"
    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border ${
      primary
        ? "bg-blue-500 hover:bg-blue-400 text-white border-blue-400/40 hover:shadow-[0_0_22px_rgba(59,130,246,0.45)]"
        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/15 hover:border-white/25 backdrop-blur-xl text-foreground"
    }`}
  >
    {children}
  </button>
);

export default Index;
