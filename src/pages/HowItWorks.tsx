import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";

const STEPS = [
  {
    n: "01",
    title: "Sign up",
    body: "Pick your path: builder or visionary. The two flows diverge from here.",
    detail:
      "Builders publish projects and look for operators. Visionaries fill out a candidate profile and get matched into projects.",
  },
  {
    n: "02",
    title: "Add credentials",
    body: "Drop your LinkedIn, upload a resume, or both. We strongly recommend both.",
    detail:
      "We require either one to start. The more we have, the faster verification clears.",
  },
  {
    n: "03",
    title: "Get verified",
    body: "A short manual review confirms shipped work. Usually under 24 hours.",
    detail:
      "We check references, public projects, and the basics of the resume. Rejected? You'll get a reviewer note and a path to resubmit.",
  },
  {
    n: "04",
    title: "Match",
    body: "Browse profiles ranked against you. Connect, pass, or save.",
    detail:
      "AI ranks the deck against your skills, project, and intent. Three actions per card. No likes, no maybes.",
  },
  {
    n: "05",
    title: "Build",
    body: "Connected? Move into DMs and ship together.",
    detail:
      "Accepted requests turn into contacts. Real chat is rolling out — for now you'll see LinkedIn shortcuts so you can pick up the conversation immediately.",
  },
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setOn(true),
      { threshold: 0.15 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, on] as const;
}

const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const [ref, on] = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${on ? "reveal-on" : ""}`}
      style={{ transitionDelay: on ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

const HowItWorks = () => (
  <div
    className="min-h-screen bg-background text-foreground"
    style={{ overflowX: "clip" }}
  >
    <Sidebar />
    <div
      className="transition-[padding] duration-300"
      style={{ paddingLeft: "var(--sidebar-width, 248px)" }}
    >
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-5">
            How it works
          </p>
          <h1 className="font-display text-5xl md:text-7xl tracking-[-0.04em] leading-[0.95] mb-8">
            Five steps.<br />Signup to shipping.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-20 leading-relaxed">
            The whole experience, from making an account to landing your
            first match.
          </p>
        </Reveal>

        <ol className="relative pl-10 md:pl-14 border-l border-white/10 space-y-16 md:space-y-20">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <li className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[44px] md:-left-[60px] top-2 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-background shadow-[0_0_18px_rgba(59,130,246,0.6)]"
                />
                <div className="flex items-baseline gap-4 md:gap-6 mb-4">
                  <span className="font-display text-stroke-soft text-4xl md:text-6xl leading-none tracking-[-0.04em] select-none">
                    {s.n}
                  </span>
                  <h2 className="font-display text-2xl md:text-4xl tracking-[-0.03em]">
                    {s.title}
                  </h2>
                </div>
                <div className="ml-0 md:ml-[5.5rem] max-w-2xl">
                  <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-3">
                    {s.body}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal>
          <div className="mt-24 pt-10 border-t border-white/10">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-base font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Start the flow
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  </div>
);

export default HowItWorks;
