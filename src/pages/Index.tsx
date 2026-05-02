import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { useAuth } from "@/context/AuthContext";

const PRINCIPLES = [
  {
    title: "Vetted, not viral.",
    body: "Members reviewed for shipped work. No growth-hacked accounts.",
  },
  {
    title: "Skill, not surface.",
    body: "Matched on capability — not background, school, or city.",
  },
  {
    title: "Decisive by design.",
    body: "Connect, pass, save. No likes. No maybes.",
  },
];

const STEPS = [
  { n: "01", title: "Sign up", body: "Builder or Visionary." },
  { n: "02", title: "Add credentials", body: "LinkedIn, resume, or both." },
  { n: "03", title: "Get verified", body: "A short vet for shipped work." },
  { n: "04", title: "Match", body: "Browse profiles. Connect or pass." },
  { n: "05", title: "Build", body: "Align fast. Ship together." },
];

function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const [ref, visible] = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-on" : ""}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

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
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          {/* HERO */}
          <section className="pt-20 pb-12 md:pt-28 md:pb-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-4">
              netstart / for builders
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-[6rem] leading-[0.92] tracking-[-0.04em] mb-6">
              The mobile app for people who actually
              <span className="text-blue-400"> build.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              A network for founders and operators who ship.
            </p>
            <div className="flex flex-wrap items-center gap-6 mb-10">
              {user ? (
                <Link
                  to="/mynet"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Open MyNet
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Sign up
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/signin"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <div className="flex gap-x-10 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                <span className="text-foreground">2,840</span> verified
              </span>
              <span>
                <span className="text-foreground">312</span> companies
              </span>
            </div>
          </section>

          <Hr />

          {/* STANDARDS — large stroke numerals, alternating offset */}
          <section id="standards" className="py-16 md:py-24">
            <Reveal>
              <header className="mb-14 md:mb-20">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-3">
                  Standards
                </p>
                <h2 className="font-display text-4xl md:text-6xl tracking-[-0.04em]">
                  What we believe.
                </h2>
              </header>
            </Reveal>

            <div className="space-y-12 md:space-y-20">
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.title} delay={i * 100}>
                  <article
                    className={`grid grid-cols-[auto_1fr] gap-6 md:gap-12 items-start ${
                      i % 2 === 1 ? "md:pl-24" : ""
                    }`}
                  >
                    <span className="font-display text-stroke text-7xl md:text-9xl leading-none tracking-[-0.05em] select-none">
                      0{i + 1}
                    </span>
                    <div className="pt-2 md:pt-4 max-w-md">
                      <h3 className="font-display text-2xl md:text-4xl tracking-[-0.03em] mb-3">
                        {p.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {p.body}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <Hr />

          {/* HOW IT WORKS — vertical timeline with active dot */}
          <section id="how" className="py-16 md:py-24">
            <Reveal>
              <header className="mb-14 md:mb-20">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-3">
                  How it works
                </p>
                <h2 className="font-display text-4xl md:text-6xl tracking-[-0.04em]">
                  From signup to shipping.
                </h2>
              </header>
            </Reveal>

            <ol className="relative pl-10 md:pl-14 border-l border-white/10 space-y-10 md:space-y-14">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <li className="relative">
                    {/* timeline marker */}
                    <span
                      aria-hidden
                      className="absolute -left-[44px] md:-left-[60px] top-1.5 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-background shadow-[0_0_18px_rgba(59,130,246,0.6)]"
                    />
                    <div className="flex items-baseline gap-4 md:gap-6">
                      <span className="font-display text-stroke-soft text-4xl md:text-6xl leading-none tracking-[-0.04em] select-none">
                        {s.n}
                      </span>
                      <div>
                        <h3 className="font-display text-xl md:text-3xl tracking-[-0.03em] mb-1.5">
                          {s.title}
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                          {s.body}
                        </p>
                      </div>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </section>

          <Hr />

          {/* DOWNLOAD — big quote-style headline */}
          <section id="download" className="py-20 md:py-28">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-4">
                Download
              </p>
              <h2 className="font-display text-5xl md:text-7xl lg:text-[5rem] tracking-[-0.04em] leading-[0.95] mb-8 max-w-3xl">
                Operators,<br />
                <span className="text-blue-400">not talkers.</span>
              </h2>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href="#"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  iOS
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Android
                </a>
              </div>
            </Reveal>
          </section>

          <footer className="border-t border-white/10 mt-4 mb-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <p>© netstart</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Manifesto
              </a>
              <a
                href="#standards"
                className="hover:text-foreground transition-colors"
              >
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

const Hr = () => <div className="h-px bg-white/10" />;

export default Index;
