import { Link } from "react-router-dom";
import { Nav } from "@/components/netstart/Nav";
import { PhoneFrame } from "@/components/netstart/PhoneFrame";
import { AppShell } from "@/components/netstart/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, MessageSquare, Sparkles, Apple, Smartphone, UserPlus, FileText, BadgeCheck } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user } = useAuth();
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
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">iOS · Android · For builders</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.25rem] leading-[0.95] mb-8">
              The mobile app for<br />
              people who <em className="text-gradient-gold not-italic">actually</em> build.
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
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-4">How it works</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1] mb-6">
            From signup to<br /><em className="text-gradient-gold not-italic">shipping.</em>
          </h2>
          <p className="text-muted-foreground text-lg">
            Find the right people faster, and start building real companies.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="group relative border border-border rounded-sm p-8 hover:border-gold/40 transition-all duration-500">
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
          ))}
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="download" className="border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-spotlight" />
        <div className="container py-28 relative text-center">
          <h2 className="font-display text-5xl md:text-7xl leading-[1] mb-6 max-w-3xl mx-auto">
            Work with operators,<br /><em className="text-gradient-gold not-italic">not talkers.</em>
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
