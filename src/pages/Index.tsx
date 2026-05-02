import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { useAuth } from "@/context/AuthContext";

const PRINCIPLES = [
  {
    title: "Vetted, not viral.",
    body: "Members reviewed for shipped work.",
  },
  {
    title: "Skill, not surface.",
    body: "Matched on capability, not background.",
  },
  {
    title: "Decisive by design.",
    body: "Connect, pass, save. No likes. No maybes.",
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
        style={{ paddingLeft: "var(--sidebar-width, 248px)" }}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          {/* HERO */}
          <section className="pt-20 pb-12 md:pt-28 md:pb-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-4">
              netstart / for builders
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight mb-5">
              The mobile app for people who actually build.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              A network for founders and operators who ship.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-10">
              {user ? (
                <Link to="/mynet" className={CTA_LINK}>
                  Open MyNet <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className={CTA_LINK}>
                    Sign up <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/signin" className={LINK}>
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <div className="flex gap-x-8 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                <span className="text-foreground">2,840</span> verified
              </span>
              <span>
                <span className="text-foreground">312</span> companies
              </span>
            </div>
          </section>

          <Hr />

          {/* STANDARDS */}
          <section id="standards" className="py-10 md:py-14">
            <div className="grid md:grid-cols-[180px_1fr] gap-4 md:gap-10">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-2">
                  Standards
                </p>
                <h2 className="font-display text-2xl md:text-3xl tracking-tight">
                  What we believe.
                </h2>
              </div>
              <div className="space-y-5">
                {PRINCIPLES.map((p, i) => (
                  <div key={p.title} className="flex items-baseline gap-4">
                    <span className="font-mono text-xs text-blue-400 tracking-[0.2em] flex-shrink-0 w-8">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-lg md:text-xl tracking-tight">
                        {p.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {p.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Hr />

          {/* HOW */}
          <section id="how" className="py-10 md:py-14">
            <div className="grid md:grid-cols-[180px_1fr] gap-4 md:gap-10">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-2">
                  How it works
                </p>
                <h2 className="font-display text-2xl md:text-3xl tracking-tight">
                  Signup to shipping.
                </h2>
              </div>
              <ol className="space-y-4">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex items-baseline gap-4">
                    <span className="font-mono text-xs text-blue-400 tracking-[0.2em] flex-shrink-0 w-8">
                      {s.n}
                    </span>
                    <div>
                      <h3 className="font-display text-lg md:text-xl tracking-tight">
                        {s.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {s.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <Hr />

          {/* DOWNLOAD */}
          <section id="download" className="py-12 md:py-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-4">
              Download
            </p>
            <h2 className="font-display text-3xl md:text-5xl tracking-tight mb-6">
              Operators, not talkers.
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className={CTA_LINK}>
                iOS <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#" className={LINK}>
                Android
              </a>
            </div>
          </section>

          <footer className="border-t border-white/8 mt-4 mb-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <p>© netstart</p>
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

const Hr = () => <div className="h-px bg-white/8" />;

const CTA_LINK =
  "inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors";
const LINK =
  "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";

export default Index;
