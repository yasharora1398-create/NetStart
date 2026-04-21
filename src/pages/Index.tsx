import { Nav } from "@/components/netstart/Nav";
import { PhoneFrame } from "@/components/netstart/PhoneFrame";
import { AppShell } from "@/components/netstart/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Filter, Layers, MessageSquare, Sparkles, Apple, Smartphone } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
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
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">iOS · Android · Invitation only</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.25rem] leading-[0.95] mb-8">
              The mobile app for<br />
              people who <em className="text-gradient-gold not-italic">actually</em> build.
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              NetStart is a closed network for founders and operators who ship.
              Decisive matching. Verified execution. In your pocket.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10 justify-center lg:justify-start">
              <Button variant="gold" size="xl" className="group">
                <Apple /> Download for iOS
              </Button>
              <Button variant="outlineGold" size="xl">
                <Smartphone /> Get on Android
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span><span className="text-gold">2,840</span> verified builders</span>
              <span><span className="text-gold">17%</span> acceptance</span>
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

      {/* PRINCIPLES */}
      <section id="standards" className="border-y border-border bg-carbon/40">
        <div className="container py-20">
          <div className="grid md:grid-cols-3 gap-px bg-border">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} className="bg-background p-10 hover:bg-carbon/50 transition-colors group">
                <div className="font-mono text-xs text-gold mb-6">0{i + 1}</div>
                <h3 className="font-display text-2xl mb-3 group-hover:text-gold transition-colors">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="container py-28">
        <div className="max-w-2xl mb-16 mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-4">The mechanics</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1] mb-6">
            Built for the<br />way operators decide.
          </h2>
          <p className="text-muted-foreground text-lg">
            No infinite scroll. No vague bios. Every profile contains proof, every interaction has structure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {FEATURES.map((f) => (
            <div key={f.title} className="group relative border border-border rounded-sm p-8 hover:border-gold/40 transition-all duration-500">
              <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center mb-6 text-gold">
                  {f.icon}
                </div>
                <h3 className="font-display text-2xl mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONVERSATIONS */}
      <section className="border-t border-border">
        <div className="container py-28 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-4">Structured conversations</p>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] mb-6">
              Skip small talk.<br />Ask what matters.
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Every connection opens with founder-grade prompts. You learn how someone thinks before you spend an hour on a call.
            </p>
            <Button variant="outlineGold">Browse the prompt library</Button>
          </div>

          <div className="space-y-3">
            {PROMPTS.map((p, i) => (
              <div
                key={p}
                className="group border border-border rounded-sm p-5 hover:border-gold/40 hover:bg-carbon/40 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs text-gold/60 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <p className="font-display text-lg leading-snug group-hover:text-gold transition-colors">{p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-spotlight" />
        <div className="container py-28 relative text-center">
          <h2 className="font-display text-5xl md:text-7xl leading-[1] mb-6 max-w-3xl mx-auto">
            Work with operators,<br /><em className="text-gradient-gold not-italic">not talkers.</em>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Applications reviewed weekly. We accept fewer than 1 in 6.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="gold" size="xl" className="group">
              <Apple /> App Store
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outlineGold" size="xl">
              <Smartphone /> Google Play
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

const FEATURES = [
  { icon: <Layers className="h-5 w-5" />, title: "Builder profiles, not resumes", body: "Shipped projects, measurable outcomes, and a 30-day buildable scope. Proof over polish." },
  { icon: <Filter className="h-5 w-5" />, title: "Compatibility scoring", body: "Skills, pace, risk tolerance, and capital expectations are weighed — not your follower count." },
  { icon: <MessageSquare className="h-5 w-5" />, title: "Founder-grade prompts", body: "Conversations open with the questions that reveal how someone actually operates." },
  { icon: <Shield className="h-5 w-5" />, title: "Visible verification", body: "Portfolio checks, reference signals, and execution badges. Quality stays high because we keep noise out." },
];

const PROMPTS = [
  "What's your 90-day execution plan?",
  "What's the biggest risk in this idea — and your honest mitigation?",
  "Why are you the right person to build this, right now?",
  "What have you shipped in the last 30 days?",
];

export default Index;
