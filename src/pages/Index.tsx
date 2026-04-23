import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Nav } from "@/components/netstart/Nav";
import { PhoneFrame } from "@/components/netstart/PhoneFrame";
import { AppShell } from "@/components/netstart/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, MessageSquare, Sparkles, Apple, Smartphone, UserPlus, FileText, BadgeCheck } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/context/AuthContext";
import builder1 from "@/assets/builder-1.jpg";
import builder2 from "@/assets/builder-2.jpg";
import builder3 from "@/assets/builder-3.jpg";

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

type Vec3 = [number, number, number];
type Node3D = { id: number; pos: Vec3; reveal: number; avatar?: string };
type Edge3D = { from: number; to: number; start: number; end: number };

const NODES_3D: Node3D[] = [
  // Hub (always visible, pulses)
  { id: 0, pos: [0, 0, 0], reveal: 0 },
  // Stage 2 — six primary branches, one along each axis
  { id: 1, pos: [48, 0, 0], reveal: 0.22 },
  { id: 2, pos: [-48, 0, 0], reveal: 0.26 },
  { id: 3, pos: [0, 48, 0], reveal: 0.30 },
  { id: 4, pos: [0, -48, 0], reveal: 0.34 },
  { id: 5, pos: [0, 0, 48], reveal: 0.38 },
  { id: 6, pos: [0, 0, -48], reveal: 0.42 },
  // Stage 3 — three profile nodes, each on its own diagonal from the hub
  { id: 7, pos: [58, 28, 22], reveal: 0.70, avatar: builder1 },
  { id: 8, pos: [-55, -22, 28], reveal: 0.76, avatar: builder2 },
  { id: 9, pos: [22, -50, -40], reveal: 0.82, avatar: builder3 },
];

// Every edge goes from the hub straight to a node, nothing chains.
const EDGES_3D: Edge3D[] = [
  { from: 0, to: 1, start: 0.16, end: 0.32 },
  { from: 0, to: 2, start: 0.20, end: 0.36 },
  { from: 0, to: 3, start: 0.24, end: 0.40 },
  { from: 0, to: 4, start: 0.28, end: 0.44 },
  { from: 0, to: 5, start: 0.32, end: 0.48 },
  { from: 0, to: 6, start: 0.36, end: 0.52 },
  { from: 0, to: 7, start: 0.62, end: 0.78 },
  { from: 0, to: 8, start: 0.68, end: 0.84 },
  { from: 0, to: 9, start: 0.74, end: 0.90 },
];

const rotY = ([x, y, z]: Vec3, a: number): Vec3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
};
const rotX = ([x, y, z]: Vec3, a: number): Vec3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
};
const project = ([x, y, z]: Vec3) => {
  const d = 160;
  const f = d / (d + z);
  return { px: x * f, py: y * f, scale: f, z };
};

const ConnectionTree3D = ({ progress }: { progress: number }) => {
  const progressRef = useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  const [frame, setFrame] = useState({ angle: 0, time: 0 });

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      // Constant slow rotation at all times
      const speed = 0.09;
      setFrame((f) => ({ angle: f.angle + speed * dt, time: t }));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const { angle, time } = frame;
  const tiltX = 0.32;

  // Pulse for the hub
  const pulse = 0.5 + 0.5 * Math.sin(time / 380);
  const hubBaseR = 4.2;
  const hubR = hubBaseR + pulse * 2.2;
  const hubHaloR = hubR * 2.4 + pulse * 4;

  // Transform nodes once per frame
  const transformed = NODES_3D.map((n) => {
    const rotated = rotY(rotX(n.pos, tiltX), angle);
    const proj = project(rotated);
    return { node: n, ...proj };
  });
  // Sort by z so further nodes render first (back to front)
  const sorted = [...transformed].sort((a, b) => a.z - b.z);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(59,130,246,${0.18 + progress * 0.25}) 0%, transparent 55%)`,
        }}
      />
      <svg viewBox="-110 -110 220 220" className="w-[90%] h-[90%] overflow-visible">
        <defs>
          <filter id="halo" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="hubCore">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="35%" stopColor="#93c5fd" />
            <stop offset="75%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          <radialGradient id="nodeCore">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
        </defs>

        {/* Edges */}
        {EDGES_3D.map((e, i) => {
          const p = progress < e.start ? 0 : progress > e.end ? 1 : (progress - e.start) / (e.end - e.start);
          if (p <= 0) return null;
          const a = transformed[e.from];
          const b = transformed[e.to];
          // Draw partial line from a to (a + (b-a) * p) for growing effect
          const endX = a.px + (b.px - a.px) * p;
          const endY = a.py + (b.py - a.py) * p;
          const depth = Math.min(a.scale, b.scale);
          return (
            <line
              key={i}
              x1={a.px}
              y1={a.py}
              x2={endX}
              y2={endY}
              stroke="#60a5fa"
              strokeWidth={0.9 * depth}
              strokeLinecap="round"
              filter="url(#line-glow)"
              opacity={0.55 + 0.45 * depth}
            />
          );
        })}

        {/* Nodes (back to front) */}
        {sorted.map(({ node, px, py, scale, z }) => {
          const np = node.reveal === 0 ? 1 : progress <= node.reveal ? 0 : Math.min(1, (progress - node.reveal) / 0.1);
          if (np <= 0) return null;
          const depthOp = 0.55 + 0.45 * scale;

          // Profile nodes
          if (node.avatar) {
            const r = 6 * scale * np;
            const clipId = `clip-${node.id}`;
            return (
              <g key={node.id} transform={`translate(${px}, ${py})`} opacity={np * depthOp}>
                <circle r={r * 1.6} fill="#60a5fa" opacity={0.4} filter="url(#halo)" />
                <clipPath id={clipId}>
                  <circle r={r} />
                </clipPath>
                <image
                  href={node.avatar}
                  x={-r}
                  y={-r}
                  width={r * 2}
                  height={r * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${clipId})`}
                />
                <circle r={r} fill="none" stroke="#93c5fd" strokeWidth={0.6 * scale} />
              </g>
            );
          }

          // Hub (id 0) — big pulsing glow
          if (node.id === 0) {
            return (
              <g key={node.id} transform={`translate(${px}, ${py})`}>
                <circle r={hubHaloR} fill="#3b82f6" opacity={0.28 + pulse * 0.22} filter="url(#halo)" />
                <circle r={hubR * 1.6} fill="#60a5fa" opacity={0.45} filter="url(#halo)" />
                <circle r={hubR} fill="url(#hubCore)" />
                <circle r={hubR * 0.35} fill="#ffffff" opacity={0.9} />
              </g>
            );
          }

          // Primary branch nodes
          const r = 2.6 * scale * np;
          return (
            <g key={node.id} transform={`translate(${px}, ${py})`} opacity={np * depthOp}>
              <circle r={r * 2} fill="#60a5fa" opacity={0.35} filter="url(#halo)" />
              <circle r={r} fill="url(#nodeCore)" />
              <circle r={r * 0.3} fill="#ffffff" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

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

  const treeRef = useRef<HTMLDivElement>(null);
  const [treeProgress, setTreeProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!treeRef.current) return;
      const rect = treeRef.current.getBoundingClientRect();
      const h = window.innerHeight;
      // Track the center of the tree (the dot). Progress is 0 when the dot
      // just enters the viewport at the bottom, 1 when the dot reaches the top.
      const dotY = rect.top + rect.height / 2;
      const p = Math.max(0, Math.min(1, (h - dotY) / h));
      setTreeProgress(p);
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

      {/* PRINCIPLES — tree on left, stacked list on right */}
      <section id="standards" className="relative border-y border-border bg-carbon/40 overflow-hidden">
        <p className="absolute top-10 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-gold z-10">
          Standards
        </p>

        <div className="container py-28 md:py-32">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* LEFT — 3D tree */}
            <div ref={treeRef} className="relative h-[420px] md:h-[640px] hidden md:block">
              <ConnectionTree3D progress={treeProgress} />
            </div>

            {/* RIGHT — stacked principles */}
            <div className="relative md:pl-10">
              <div className="hidden md:block absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              <h2 className="font-display text-4xl md:text-5xl leading-[1.05] mb-12">
                What we <em className="text-gradient-gold not-italic">stand for.</em>
              </h2>
              <div className="space-y-10">
                {PRINCIPLES.map((p, i) => (
                  <div key={p.title} className="border-l-2 border-blue-500/40 pl-6">
                    <div className="font-mono text-sm text-blue-400 mb-3 tracking-[0.3em]">0{i + 1}</div>
                    <h3 className="font-display text-2xl md:text-3xl mb-3">{p.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
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
