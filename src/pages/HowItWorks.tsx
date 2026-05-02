import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import {
  StepSignup,
  StepCredentials,
  StepAccepted,
  StepMatch,
  StepChat,
} from "@/components/mockups/Steps";

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

const STEPS: {
  n: string;
  title: string;
  body: string;
  detail: string;
  visual: React.ReactNode;
}[] = [
  {
    n: "01",
    title: "Sign up",
    body: "Create your account in under a minute. Pick your path: builder or visionary.",
    detail:
      "Builders publish projects and look for operators. Visionaries fill out a candidate profile and get matched into projects. The two flows diverge from here.",
    visual: <StepSignup />,
  },
  {
    n: "02",
    title: "Add credentials",
    body: "Drop your LinkedIn, upload a resume, or both.",
    detail:
      "We require either to start. The more signal we have, the faster verification clears. Both is strongly recommended.",
    visual: <StepCredentials />,
  },
  {
    n: "03",
    title: "Get verified",
    body: "A short manual review confirms shipped work. Usually under 24 hours.",
    detail:
      "We check references, public projects, and the basics of the resume. Rejected? You'll get a reviewer note and a path to resubmit.",
    visual: <StepAccepted />,
  },
  {
    n: "04",
    title: "Match",
    body: "Browse a deck ranked against your profile. Three actions per card.",
    detail:
      "Connect, save, or pass. No likes, no maybes. AI ranks the deck against your skills, project, and intent.",
    visual: <StepMatch />,
  },
  {
    n: "05",
    title: "Build",
    body: "Once you connect, you land in DMs. Pick up the thread and ship.",
    detail:
      "Accepted requests turn into mutual contacts. Pick up the conversation immediately and align on what's next.",
    visual: <StepChat />,
  },
];

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
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-6 pb-20 md:pt-10 md:pb-24">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-5">
            How it works
          </p>
          <h1 className="font-display text-4xl md:text-6xl tracking-[-0.04em] leading-[0.95] mb-6">
            Five steps.<br />Signup to shipping.
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mb-20 leading-relaxed">
            From making an account to landing your first match, the
            whole experience is built to be fast and decisive.
          </p>
        </Reveal>

        <div className="space-y-28 md:space-y-36">
          {STEPS.map((s, i) => {
            const reverse = i % 2 === 1;
            return (
              <Reveal key={s.n} delay={i * 60}>
                <article className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
                  <div className={reverse ? "md:order-2" : ""}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-3">
                      Step {s.n}
                    </p>
                    <h2 className="font-display text-3xl md:text-5xl tracking-[-0.03em] mb-4">
                      {s.title}
                    </h2>
                    <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-3 max-w-md">
                      {s.body}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      {s.detail}
                    </p>
                  </div>
                  <div
                    className={`flex justify-center ${reverse ? "md:order-1" : ""}`}
                  >
                    {s.visual}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-32 pt-10 border-t border-white/10 flex items-center justify-between gap-6 flex-wrap">
            <p className="text-base md:text-lg text-muted-foreground max-w-md">
              That's it. The rest is up to you.
            </p>
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
