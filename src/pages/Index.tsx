import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Nav } from "@/components/netstart/Nav";
import { PhoneFrame } from "@/components/netstart/PhoneFrame";
import { AppShell } from "@/components/netstart/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, MessageSquare, Sparkles, Apple, Smartphone, UserPlus, FileText, BadgeCheck } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/context/AuthContext";

function useInViewOnce<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

const BoxReveal = ({ children }: { children: React.ReactNode }) => {
  const [ref, visible] = useInViewOnce<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className="transition-all ease-out"
      style={{
        transitionDuration: "900ms",
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0)" : "blur(12px)",
        transform: visible ? "translateY(0)" : "translateY(40px)",
      }}
    >
      {children}
    </div>
  );
};

type TreeNode = { x: number; y: number; start: number };
type TreeEdge = { from: number; to: number; start: number; end: number };

const TREE_NODES: TreeNode[] = [
  { x: 50, y: 112, start: 0.00 },
  { x: 24, y: 82, start: 0.10 },
  { x: 50, y: 82, start: 0.13 },
  { x: 76, y: 82, start: 0.10 },
  { x: 11, y: 48, start: 0.38 },
  { x: 30, y: 48, start: 0.42 },
  { x: 42, y: 48, start: 0.47 },
  { x: 58, y: 48, start: 0.52 },
  { x: 70, y: 48, start: 0.55 },
  { x: 89, y: 48, start: 0.58 },
  { x: 20, y: 18, start: 0.76 },
  { x: 50, y: 14, start: 0.82 },
  { x: 80, y: 18, start: 0.76 },
];

const TREE_EDGES: TreeEdge[] = [
  { from: 0, to: 1, start: 0.00, end: 0.15 },
  { from: 0, to: 2, start: 0.02, end: 0.18 },
  { from: 0, to: 3, start: 0.00, end: 0.15 },
  { from: 1, to: 4, start: 0.18, end: 0.42 },
  { from: 1, to: 5, start: 0.20, end: 0.46 },
  { from: 2, to: 6, start: 0.22, end: 0.50 },
  { from: 2, to: 7, start: 0.24, end: 0.54 },
  { from: 3, to: 8, start: 0.26, end: 0.58 },
  { from: 3, to: 9, start: 0.28, end: 0.62 },
  { from: 5, to: 10, start: 0.58, end: 0.80 },
  { from: 6, to: 11, start: 0.62, end: 0.85 },
  { from: 7, to: 11, start: 0.64, end: 0.87 },
  { from: 8, to: 12, start: 0.66, end: 0.90 },
];

const ConnectionTree = ({ progress }: { progress: number }) => (
  <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1400px" }}>
    <div
      className="w-[85%] h-[85%]"
      style={{ transform: "rotateX(10deg) rotateY(-8deg)", transformStyle: "preserve-3d" }}
    >
      <svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
        <defs>
          <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="node-halo" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <radialGradient id="node-core">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="35%" stopColor="#60a5fa" />
            <stop offset="80%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>

        {TREE_EDGES.map((e, i) => {
          const a = TREE_NODES[e.from];
          const b = TREE_NODES[e.to];
          const p = progress < e.start ? 0 : progress > e.end ? 1 : (progress - e.start) / (e.end - e.start);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#60a5fa"
              strokeWidth="0.55"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - p}
              strokeLinecap="round"
              filter="url(#edge-glow)"
              opacity={p > 0 ? 0.95 : 0}
            />
          );
        })}

        {TREE_NODES.map((n, i) => {
          const np = progress <= n.start ? 0 : Math.min(1, (progress - n.start) / 0.08);
          if (np <= 0) return null;
          return (
            <g key={i} transform={`translate(${n.x}, ${n.y})`}>
              <circle r={3.2 * np} fill="#60a5fa" opacity={np * 0.45} filter="url(#node-halo)" />
              <circle r={1.5 * np} fill="url(#node-core)" opacity={np} />
              <circle r={0.45 * np} fill="#ffffff" opacity={np} />
            </g>
          );
        })}
      </svg>
    </div>

    {/* Ambient blue glow under the tree */}
    <div
      className="absolute inset-0 -z-10 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at 50% 60%, rgba(59,130,246,${0.12 + progress * 0.18}) 0%, transparent 60%)`,
      }}
    />
  </div>
);

const wordStyle = (visible: boolean, i: number): CSSProperties => ({
  display: "inline-block",
  marginRight: "0.22em",
  transitionProperty: "opacity, filter, transform",
  transitionDuration: "800ms",
  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  opacity: visible ? 1 : 0,
  filter: visible ? "blur(0)" : "blur(10px)",
  transform: visible ? "translateY(0)" : "translateY(18px)",
  transitionDelay: visible ? `${i * 90}ms` : "0ms",
});

const Index = () => {
  const { user } = useAuth();
  const [heroRef, heroVisible] = useInViewOnce<HTMLHeadingElement>(0.1);
  const [howRef, howVisible] = useInViewOnce<HTMLHeadingElement>(0.3);
  const [downloadRef, downloadVisible] = useInViewOnce<HTMLHeadingElement>(0.3);

  const pinRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!pinRef.current) return;
      const total = pinRef.current.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const rect = pinRef.current.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -rect.top / total));
      setProgress(p);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ overflowX: "clip" }}>
      <Nav />

      {/* HERO */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div className="container grid lg:grid-cols-[1.05fr_1fr] gap-16 lg:gap-12 items-center">
          <div className="animate-fade-up text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-8">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">iOS · Android · For builders</span>
            </div>

            <h1 ref={heroRef} className="font-display text-5xl md:text-7xl lg:text-[5.25rem] leading-[0.95] mb-8">
              {[
                { text: "The" },
                { text: "mobile" },
                { text: "app" },
                { text: "for", break: true },
                { text: "people" },
                { text: "who" },
                { text: "actually", italic: true },
                { text: "build." },
              ].map((w, i) => (
                <span key={i}>
                  {w.italic ? (
                    <em className="text-gradient-gold not-italic" style={wordStyle(heroVisible, i)}>
                      {w.text}
                    </em>
                  ) : (
                    <span style={wordStyle(heroVisible, i)}>{w.text}</span>
                  )}
                  {w.break && <br />}
                </span>
              ))}
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              NetStart is a network for founders and operators who ship.
              Decisive matching. Verified execution. In your pocket.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10 justify-center lg:justify-start">
              {user ? (
                <a href="#download">
                  <Button variant="gold" size="xl">Download the app</Button>
                </a>
              ) : (
                <>
                  <Link to="/signin">
                    <Button variant="outlineGold" size="xl">Sign in</Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="gold" size="xl">Sign up</Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span><span className="text-gold">2,840</span> verified builders</span>
              <span><span className="text-gold">312</span> companies started</span>
            </div>
          </div>

          <div className="lg:pl-4 mt-8 lg:mt-0">
            <PhoneFrame>
              <AppShell />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* PRINCIPLES — pinned: tree on left, horizontal scroll on right */}
      <section
        ref={pinRef}
        id="standards"
        className="relative border-y border-border bg-carbon/40"
        style={{ height: "300vh" }}
      >
        <div className="sticky top-0 h-screen overflow-hidden bg-carbon/40 flex">
          <p className="absolute top-10 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-gold z-10">
            Standards
          </p>

          {/* LEFT — connection tree */}
          <div className="w-1/2 h-full hidden md:block">
            <ConnectionTree progress={progress} />
          </div>

          {/* RIGHT — horizontal scroll (desktop). Mobile falls back to stacked. */}
          <div className="w-full md:w-1/2 h-full overflow-hidden md:flex items-center hidden">
            <div
              className="flex h-full items-center"
              style={{
                transform: `translate3d(-${progress * 100}vw, 0, 0)`,
                willChange: "transform",
              }}
            >
              {PRINCIPLES.map((p, i) => (
                <div
                  key={p.title}
                  className="flex-shrink-0 h-full flex items-center"
                  style={{ width: "50vw" }}
                >
                  <div className="max-w-xl px-10 md:px-14">
                    <div className="font-mono text-sm text-gold mb-8 tracking-[0.3em]">0{i + 1}</div>
                    <h3 className="font-display text-4xl md:text-6xl leading-[1.05] mb-6">
                      {p.title}
                    </h3>
                    <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MOBILE fallback — stacked */}
          <div className="md:hidden w-full h-full overflow-y-auto flex flex-col items-center justify-center px-6 py-16 space-y-16">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} className="max-w-md text-center">
                <div className="font-mono text-sm text-gold mb-6 tracking-[0.3em]">0{i + 1}</div>
                <h3 className="font-display text-3xl mb-4">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="container py-28">
        <div className="max-w-2xl mb-16 mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-4">How it works</p>
          <h2 ref={howRef} className="font-display text-4xl md:text-6xl leading-[1] mb-6">
            {[
              { text: "From" },
              { text: "signup" },
              { text: "to", break: true },
              { text: "shipping.", italic: true },
            ].map((w, i) => (
              <span key={i}>
                {w.italic ? (
                  <em className="text-gradient-gold not-italic" style={wordStyle(howVisible, i)}>
                    {w.text}
                  </em>
                ) : (
                  <span style={wordStyle(howVisible, i)}>{w.text}</span>
                )}
                {w.break && <br />}
              </span>
            ))}
          </h2>
          <p className="text-muted-foreground text-lg">
            Find the right people faster, and start building real companies.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {STEPS.map((s, i) => (
            <BoxReveal key={s.title}>
              <div className="group relative border border-border rounded-sm p-8 hover:border-gold/40 transition-all duration-500">
                <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex gap-6 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    <div className="font-mono text-xs text-gold">0{i + 1}</div>
                    <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                      {s.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-2xl mb-2 group-hover:text-gold transition-colors">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            </BoxReveal>
          ))}
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="download" className="border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-spotlight" />
        <div className="container py-28 relative text-center">
          <h2 ref={downloadRef} className="font-display text-5xl md:text-7xl leading-[1] mb-6 max-w-3xl mx-auto">
            {[
              { text: "Work" },
              { text: "with" },
              { text: "operators,", break: true },
              { text: "not", italic: true },
              { text: "talkers.", italic: true },
            ].map((w, i) => (
              <span key={i}>
                {w.italic ? (
                  <em className="text-gradient-gold not-italic" style={wordStyle(downloadVisible, i)}>
                    {w.text}
                  </em>
                ) : (
                  <span style={wordStyle(downloadVisible, i)}>{w.text}</span>
                )}
                {w.break && <br />}
              </span>
            ))}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Download the app and start building today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="gold" size="xl" className="group">
              <Apple /> Download for iOS
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outlineGold" size="xl">
              <Smartphone /> Download for Android
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="font-mono text-xs uppercase tracking-widest">© NetStart · A network for builders</p>
          <div className="flex gap-6 text-xs font-mono uppercase tracking-widest">
            <a href="#" className="hover:text-foreground transition-colors">Manifesto</a>
            <a href="#" className="hover:text-foreground transition-colors">Standards</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const PRINCIPLES = [
  { title: "Vetted, not viral", body: "Every member is reviewed for shipped work, references, and execution signal. No growth-hacked accounts." },
  { title: "Skill, not surface", body: "Matching prioritizes complementary capability over background, school, or city. Builders find counterweights." },
  { title: "Decisive by design", body: "Connect, pass, or save. No likes, no maybes. Your time is the asset we protect most." },
];

const STEPS = [
  { icon: <UserPlus className="h-5 w-5" />, title: "Create your account", body: "Sign up and choose your path: Builder or Visionary." },
  { icon: <FileText className="h-5 w-5" />, title: "Add your credentials", body: "Link your LinkedIn or upload your resume. Include proof of work: projects or a portfolio." },
  { icon: <BadgeCheck className="h-5 w-5" />, title: "Get verified", body: "Complete a short vetting process to confirm your skills or idea quality. This keeps the network high caliber." },
  { icon: <Filter className="h-5 w-5" />, title: "Discover matches", body: "Browse curated profiles and startup ideas. Choose Connect, Pass, or Save. Like Tinder, but focused on building." },
  { icon: <MessageSquare className="h-5 w-5" />, title: "Connect and build", body: "Match with people who fit your goals and skillset. Start conversations, align quickly, and begin building." },
];

export default Index;
