import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const PRINCIPLES = [
  {
    title: "Vetted, not viral.",
    body: "Every member is reviewed for shipped work, references, and execution signal. No growth-hacked accounts.",
  },
  {
    title: "Skill, not surface.",
    body: "Matching prioritizes complementary capability over background, school, or city.",
  },
  {
    title: "Decisive by design.",
    body: "Connect, pass, or save. No likes, no maybes. Your time is the asset we protect.",
  },
];

const STEPS = [
  { n: "01", title: "Create your account", body: "Sign up and choose your path: Builder or Visionary." },
  { n: "02", title: "Add your credentials", body: "Link your LinkedIn, upload your resume, or both." },
  { n: "03", title: "Get verified", body: "A short vetting process to confirm shipped work." },
  { n: "04", title: "Discover matches", body: "Browse curated profiles. Connect, pass, or save." },
  { n: "05", title: "Connect and build", body: "Match with people who fit, then ship." },
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
        {/* HERO */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-40">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-8">
              NetStart · for builders
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-[6.5rem] leading-[0.95] tracking-tight mb-8">
              The mobile app for people who actually build.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
              A network for founders and operators who ship. Decisive matching.
              Verified execution. In your pocket.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <Link to="/mynet">
                  <Button variant="default" size="xl" className="bg-blue-500 hover:bg-blue-400 text-white">
                    Open MyNet
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button variant="default" size="xl" className="bg-blue-500 hover:bg-blue-400 text-white">
                      Sign up
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/signin">
                    <Button variant="ghost" size="xl">
                      Sign in
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="mt-16 flex flex-wrap gap-x-12 gap-y-3 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                <span className="text-foreground">2,840</span> verified builders
              </span>
              <span>
                <span className="text-foreground">312</span> companies started
              </span>
            </div>
          </div>
        </section>

        {/* STANDARDS */}
        <section id="standards" className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-6">
              Standards
            </p>
            <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-16">
              What we believe.
            </h2>

            <div className="grid md:grid-cols-3 gap-px bg-border">
              {PRINCIPLES.map((p, i) => (
                <div
                  key={p.title}
                  className="bg-background p-8 md:p-10 hover:bg-card transition-colors"
                >
                  <div className="font-mono text-sm text-blue-400 mb-6 tracking-[0.25em]">
                    0{i + 1}
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl mb-4 tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-6">
              How it works
            </p>
            <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-16">
              From signup to shipping.
            </h2>

            <ol className="divide-y divide-border border-y border-border">
              {STEPS.map((s) => (
                <li key={s.n} className="py-8 grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] gap-6 items-baseline">
                  <span className="font-mono text-sm text-blue-400 tracking-[0.25em]">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl mb-2 tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* DOWNLOAD */}
        <section id="download">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-40">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-6">
              Download
            </p>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight mb-8 max-w-3xl">
              Work with operators, not talkers.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mb-12 leading-relaxed">
              Download the app and start building today.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default" size="xl" className="bg-blue-500 hover:bg-blue-400 text-white">
                Download for iOS
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="xl">
                Download for Android
              </Button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <p>© NetStart · A network for builders</p>
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
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
