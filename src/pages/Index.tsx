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

const StaggerReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [ref, visible] = useInViewOnce<HTMLDivElement>(0.1);
  return (
    <div
      ref={ref}
      className="h-full transition-all ease-out"
      style={{
        transitionDuration: "1100ms",
        transitionDelay: visible ? `${delay}ms` : "0ms",
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0)" : "blur(14px)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(60px) scale(1.05)",
      }}
    >
      {children}
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

      {/* PRINCIPLES — staggered reveal grid */}
      <section id="standards" className="relative border-y border-border bg-carbon/40 overflow-hidden">
        <div className="container py-28 md:py-36">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">Standards</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[1]">
              What we <em className="text-gradient-gold not-italic">believe.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {PRINCIPLES.map((p, i) => (
              <StaggerReveal key={p.title} delay={i * 180}>
                <div className="relative h-full border border-border/60 bg-background/40 backdrop-blur-sm rounded-sm p-10 md:p-12 group hover:border-gold/40 transition-all duration-700 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative">
                    <div className="font-mono text-sm tracking-[0.3em] text-gold mb-8">0{i + 1}</div>
                    <h3 className="font-display text-3xl mb-5 group-hover:text-gold transition-colors duration-500">{p.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{p.body}</p>
                  </div>
                </div>
              </StaggerReveal>
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
