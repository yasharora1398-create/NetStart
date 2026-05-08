import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  Heart,
  Hourglass,
  MapPin,
  MessageSquare,
  Send,
  Sparkles,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useInView } from "@/hooks/useInView";

const WHY: {
  icon: typeof BadgeCheck;
  title: string;
  body: string;
  details: string[];
  mockup: "waiting" | "swipe" | "connect";
}[] = [
  {
    icon: BadgeCheck,
    title: "Vetted, not viral.",
    body: "Every member reviewed for shipped work. No accounts farmed for engagement.",
    details: [
      "Manual review of every signup, not auto-approval.",
      "LinkedIn + resume cross-checked against public work.",
      "Rejected applicants get a reviewer note and a resubmit path.",
    ],
    mockup: "waiting",
  },
  {
    icon: Sparkles,
    title: "Matches ranked by AI.",
    body: "The deck is ordered against your skills, project, and intent. Not the algorithm's.",
    details: [
      "Embeddings of your profile + project intent drive ranking.",
      "Skills weighted by what you've actually shipped, not claimed.",
      "Re-ranks daily as profiles and projects update.",
    ],
    mockup: "swipe",
  },
  {
    icon: Zap,
    title: "Decisive by design.",
    body: "Connect, save, or pass. No likes, no maybes. Apply with one real pitch.",
    details: [
      "Three actions per card. No fourth option to defer.",
      "One pitch per application — no copy-paste spam.",
      "Accepted requests turn into mutual contacts immediately.",
    ],
    mockup: "connect",
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
          <Reveal>
          <section className="pt-6 md:pt-12 pb-12 md:pb-16 max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] mb-5 text-primary">
              polln8 / for builders
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-[6rem] leading-[0.92] tracking-[-0.03em] mb-5 text-foreground font-bold">
              The mobile app for people who actually
              <span className="italic text-primary"> build.</span>
            </h1>
            <p className="text-base md:text-lg max-w-md mb-8 leading-relaxed text-muted-foreground">
              Vetted founders and operators. Matches ranked by AI. Connect, pass,
              or save. No maybes.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <Link to="/mynet">
                  <PrimaryButton>Open MyNet</PrimaryButton>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <PrimaryButton>Sign up free</PrimaryButton>
                  </Link>
                  <Link
                    to="/signin"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </section>
          </Reveal>

          {/* WHY — three reasons, each as a row with text on the left
              and an animated demo mockup on the right. Hover the row
              to play the mockup's motion (waiting check-in, swipe deck,
              apply-and-chat). */}
          <section className="py-10 md:py-14 space-y-20 md:space-y-28">
            {WHY.map((w) => (
              <Reveal key={w.title}>
                <WhyRow entry={w} />
              </Reveal>
            ))}
          </section>

          {/* HOW — single line flow */}
          <Reveal delay={120}>
          <section className="py-10 md:py-14">
            <div className="grid md:grid-cols-[160px_1fr] gap-6 md:gap-12 items-baseline">
              <Link
                to="/how"
                className="group inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-primary transition-colors hover:opacity-80"
              >
                How it works
                <ArrowRight className="h-3 w-3 mt-0.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="font-display text-2xl md:text-4xl tracking-[-0.02em] leading-[1.15] max-w-3xl text-foreground font-bold">
                Sign up. Verify. Match.{" "}
                <span className="italic text-primary">Build.</span>
              </p>
            </div>
          </section>
          </Reveal>

          {/* CLOSING CTA — alt-section panel */}
          <Reveal>
          <section className="py-12 md:py-16">
            <div className="p-8 md:p-12 bg-secondary border border-border rounded-2xl">
              <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 items-end">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] mb-4 inline-flex items-center gap-2 text-primary">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                      style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.55)" }}
                    />
                    Apply to join
                  </p>
                  <h2 className="font-display text-3xl md:text-5xl tracking-[-0.025em] leading-[1] mb-3 text-foreground font-bold">
                    Operators,
                    <br />
                    <span className="italic text-muted-foreground">
                      not talkers.
                    </span>
                  </h2>
                  <p className="text-sm md:text-base max-w-md leading-relaxed text-muted-foreground">
                    Free to apply. Quick manual review.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 min-w-[220px]">
                  {user ? (
                    <Link to="/mynet">
                      <CtaButton primary label="Open MyNet" sub="Continue" />
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup">
                        <CtaButton
                          primary
                          label="Sign up free"
                          sub="Free to apply"
                        />
                      </Link>
                      <Link to="/download">
                        <CtaButton label="Get the app" sub="iOS & Android" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
          </Reveal>

          <footer className="mt-4 mb-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] border-t border-border text-muted-foreground">
            <p>© Polln8</p>
            <div className="flex gap-6">
              <Link to="/how" className="transition-colors hover:text-foreground">
                How it works
              </Link>
              <Link
                to="/standards"
                className="transition-colors hover:text-foreground"
              >
                Standards
              </Link>
              <Link
                to="/download"
                className="transition-colors hover:text-foreground"
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

// Fade-up + un-blur as the wrapped block enters the viewport. Uses
// the shared .reveal / .reveal-on classes from index.css so all
// reveals across the site share one motion language.
const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div
      ref={ref}
      className={`reveal${inView ? " reveal-on" : ""}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

// Each WHY row: text block on the left, animated mockup on the right.
// The whole row is a `group` so the mockup's hover-driven animations
// fire as soon as the cursor enters the row, not just the mockup.
const WhyRow = ({ entry }: { entry: (typeof WHY)[number] }) => {
  const Icon = entry.icon;
  return (
    <article className="group grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg mb-5 bg-primary/10 border border-primary/40 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display text-2xl md:text-3xl mb-3 tracking-[-0.02em] text-foreground font-bold">
          {entry.title}
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground mb-5 max-w-md">
          {entry.body}
        </p>
        <ul className="space-y-2 border-l border-primary/30 pl-4 max-w-md">
          {entry.details.map((d) => (
            <li
              key={d}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {d}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-center md:justify-end">
        {entry.mockup === "waiting" && <WaitingMockup />}
        {entry.mockup === "swipe" && <SwipeMockup />}
        {entry.mockup === "connect" && <ConnectMockup />}
      </div>
    </article>
  );
};

// ─── Animated mockups ────────────────────────────────────────────
// Each one is a self-contained desktop card-like artifact. None of
// them load external video; the motion is pure CSS keyframes that
// activate on row hover via the parent `.group` class. They reset
// when the cursor leaves so the next hover replays the sequence.

// 1. Waiting mockup — review-pending state. On hover, the three
// review checks tick in sequence and the hourglass spins.
const WaitingMockup = () => (
  <div className="w-full max-w-[360px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
    {/* Browser-like top bar to make it read as a real screen. */}
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary border-b border-border">
      <span className="h-2 w-2 rounded-full bg-foreground/15" />
      <span className="h-2 w-2 rounded-full bg-foreground/15" />
      <span className="h-2 w-2 rounded-full bg-foreground/15" />
      <span className="ml-2 text-[10px] font-mono text-muted-foreground">
        polln8.com / mynet
      </span>
    </div>
    <div className="p-6">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/40 bg-primary/10 mb-5">
        <Hourglass className="h-3 w-3 text-primary group-hover:animate-spin" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
          Review pending
        </span>
      </div>
      <h4 className="font-display text-2xl mb-1 text-foreground">Submitted.</h4>
      <p className="text-xs text-muted-foreground mb-5">
        We'll review your credentials shortly.
      </p>
      <ul className="space-y-2.5">
        <CheckRow label="Profile uploaded" delay={0} />
        <CheckRow label="LinkedIn verified" delay={300} />
        <CheckRow label="Awaiting reviewer" delay={650} pending />
      </ul>
    </div>
  </div>
);

const CheckRow = ({
  label,
  delay,
  pending = false,
}: {
  label: string;
  delay: number;
  pending?: boolean;
}) => (
  <li className="flex items-center gap-3 text-xs">
    <span
      className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
        pending
          ? "bg-primary/10 border border-primary/40 text-primary group-hover:animate-pulse"
          : "bg-foreground/[0.04] border border-border text-transparent group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {pending ? (
        <Hourglass className="h-2.5 w-2.5" />
      ) : (
        <Check className="h-3 w-3" strokeWidth={3} />
      )}
    </span>
    <span
      className={`transition-colors duration-300 ${
        pending
          ? "text-foreground"
          : "text-muted-foreground group-hover:text-foreground"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {label}
    </span>
  </li>
);

// 2. Swipe mockup — phone with anonymous match cards. On hover the
// front card swipes off-screen revealing the next one. No avatars;
// just an anonymous monogram + role + signal-rich body.
const SwipeMockup = () => (
  <div
    className="relative w-[260px] h-[440px] rounded-[36px] border-[8px] border-foreground/85 bg-background shadow-2xl overflow-hidden"
    style={{ transform: "rotate(-2deg)" }}
  >
    {/* Notch */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-20 bg-foreground/85 rounded-b-2xl z-30" />
    {/* Status row */}
    <div className="absolute top-1.5 left-0 right-0 px-5 flex items-center justify-between text-[9px] font-mono text-foreground/70 tracking-widest z-20">
      <span>9:41</span>
      <span>polln8</span>
    </div>
    {/* Header */}
    <div className="absolute top-7 left-0 right-0 px-4 z-10">
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        Ranked deck · live
      </p>
    </div>

    {/* Card stack — front card swipes off on row hover. */}
    <div className="absolute inset-0 top-14 bottom-20 px-3">
      {/* Back card (peeks through after the front leaves). */}
      <AnonCard
        offsetClass="translate-y-[6px] translate-x-[3px] scale-[0.96] opacity-80"
        title="Senior infra engineer"
        signals={["Distributed systems", "Rust", "Postgres"]}
        commitment="Full-time"
        location="Remote · NA"
        match="92%"
        zIndex={10}
      />
      {/* Front card — translates off and rotates on hover. */}
      <div
        className="absolute inset-3 transition-all duration-700 ease-out group-hover:translate-x-[140%] group-hover:rotate-[14deg] group-hover:opacity-0"
        style={{ zIndex: 20 }}
      >
        <AnonCardInner
          title="Senior backend engineer"
          signals={["Payments", "Postgres", "TypeScript"]}
          commitment="Full-time"
          location="London"
          match="96%"
        />
      </div>
    </div>

    {/* Action row — three signature actions. The Connect button
        gets a soft pulse on hover to draw the eye. */}
    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-30">
      <ActionDot icon={<X className="h-3.5 w-3.5" />} tone="muted" />
      <ActionDot icon={<Heart className="h-3.5 w-3.5" />} tone="muted" />
      <ActionDot
        icon={<ArrowRight className="h-3.5 w-3.5" />}
        tone="primary"
        pulse
      />
    </div>
  </div>
);

const AnonCard = ({
  offsetClass,
  title,
  signals,
  commitment,
  location,
  match,
  zIndex,
}: {
  offsetClass: string;
  title: string;
  signals: string[];
  commitment: string;
  location: string;
  match: string;
  zIndex: number;
}) => (
  <div
    className={`absolute inset-3 ${offsetClass} transition-transform duration-500`}
    style={{ zIndex }}
  >
    <AnonCardInner
      title={title}
      signals={signals}
      commitment={commitment}
      location={location}
      match={match}
    />
  </div>
);

const AnonCardInner = ({
  title,
  signals,
  commitment,
  location,
  match,
}: {
  title: string;
  signals: string[];
  commitment: string;
  location: string;
  match: string;
}) => (
  <div
    className="h-full flex flex-col p-4 rounded-2xl bg-card border border-border"
    style={{ boxShadow: "0 10px 24px -10px rgba(0,0,0,0.3)" }}
  >
    {/* Anonymous monogram — no profile image, deliberately
        abstract so the visual emphasis is on the signal data. */}
    <div className="flex items-center gap-3 mb-3">
      <div className="h-10 w-10 rounded-full border border-dashed border-primary/50 bg-primary/5 flex items-center justify-center text-primary">
        <UserRound className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-[13px] text-foreground truncate">
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground">Anonymous · pre-match</p>
      </div>
    </div>
    <div className="space-y-1.5 mb-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Briefcase className="h-3 w-3 text-primary" />
        {commitment}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3 text-primary" />
        {location}
      </div>
    </div>
    <div className="flex flex-wrap gap-1 mb-2">
      {signals.map((s) => (
        <span
          key={s}
          className="px-1.5 py-0.5 text-[9px] rounded-sm border border-primary/30 bg-primary/5 text-foreground"
        >
          {s}
        </span>
      ))}
    </div>
    <div className="mt-auto pt-2.5 border-t border-border flex items-center justify-between">
      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
        Match
      </span>
      <span className="text-[11px] font-medium text-primary">{match}</span>
    </div>
  </div>
);

const ActionDot = ({
  icon,
  tone,
  pulse = false,
}: {
  icon: React.ReactNode;
  tone: "muted" | "primary";
  pulse?: boolean;
}) => (
  <div
    className={`h-9 w-9 rounded-full flex items-center justify-center border transition-transform ${
      tone === "primary"
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-muted-foreground border-border"
    } ${pulse ? "group-hover:scale-110 group-hover:animate-pulse" : ""}`}
  >
    {icon}
  </div>
);

// 3. Connect mockup — the apply / chat moment. On hover, "Apply"
// presses, a "Pitch sent" toast slides in, and a chat preview
// panel slides up showing DMs unlocked.
const ConnectMockup = () => (
  <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary border-b border-border">
      <span className="h-2 w-2 rounded-full bg-foreground/15" />
      <span className="h-2 w-2 rounded-full bg-foreground/15" />
      <span className="h-2 w-2 rounded-full bg-foreground/15" />
      <span className="ml-2 text-[10px] font-mono text-muted-foreground">
        polln8.com / project
      </span>
    </div>
    <div className="p-5 relative">
      {/* Project preview */}
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1.5">
        Pre-seed · YC W26
      </p>
      <h4 className="font-display text-lg mb-2 text-foreground leading-tight">
        Climate fintech, looking for a backend lead.
      </h4>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Verification rails for carbon credits. Funded by an angel from Stripe.
        Offering 8 to 15% equity.
      </p>

      {/* Three actions */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className="px-3 py-2 text-xs rounded-md border border-border bg-background flex items-center gap-1.5 transition-colors"
          tabIndex={-1}
        >
          <X className="h-3 w-3" />
          Pass
        </button>
        <button
          type="button"
          className="px-3 py-2 text-xs rounded-md border border-border bg-background flex items-center gap-1.5 transition-colors"
          tabIndex={-1}
        >
          <Heart className="h-3 w-3" />
          Save
        </button>
        <button
          type="button"
          className="px-3 py-2 text-xs rounded-md bg-primary text-primary-foreground flex items-center gap-1.5 ml-auto transition-transform group-hover:scale-95"
          style={{ boxShadow: "var(--shadow-glow)" }}
          tabIndex={-1}
        >
          <Send className="h-3 w-3" />
          Apply with pitch
        </button>
      </div>

      {/* "Pitch sent" toast — slides in on hover */}
      <div className="rounded-md border border-primary/40 bg-primary/10 p-2.5 flex items-center gap-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-200">
        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span className="text-[11px] text-foreground">
          Pitch sent. Founder will review your profile.
        </span>
      </div>

      {/* DM preview — slides up after the toast */}
      <div className="mt-3 rounded-lg border border-border bg-background p-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-[600ms]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium text-foreground">
            DM unlocked
          </span>
          <span className="ml-auto text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
            Mutual contact
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="rounded-md bg-secondary p-2 text-[11px] text-foreground inline-block">
            Hey — saw your shipping history. Want to do a 20-min call this week?
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PrimaryButton = ({ children }: { children: React.ReactNode }) => (
  <button
    type="button"
    className="group inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90"
    style={{ boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)" }}
  >
    {children}
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </button>
);

const CtaButton = ({
  label,
  sub,
  primary = false,
}: {
  label: string;
  sub: string;
  primary?: boolean;
}) => (
  <span
    className={`group flex items-center gap-3 transition-all min-w-[220px] cursor-pointer rounded-lg ${
      primary
        ? "bg-primary text-primary-foreground px-5 py-3"
        : "bg-card text-foreground border-[1.5px] border-primary px-5 py-[10.5px]"
    }`}
    style={
      primary
        ? { boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)" }
        : undefined
    }
  >
    <span className="text-sm font-medium block flex-1">
      <span className="block leading-tight">{label}</span>
      <span className="block text-[10px] font-mono uppercase tracking-[0.18em] mt-0.5 opacity-65">
        {sub}
      </span>
    </span>
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </span>
);

export default Index;
