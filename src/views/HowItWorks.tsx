"use client";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  StepSignup,
  StepCredentials,
  StepAccepted,
  StepMatch,
  StepChat,
} from "@/components/mockups/Steps";
import { Sidebar } from "@/components/netstart/Sidebar";
import { usePageMeta } from "@/hooks/usePageMeta";

// Sidebar shows everywhere now; /how is treated as an internal
// product page rather than a sidebar-less marketing surface.
const SHOW_SIDEBAR = true;

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
    n: "1",
    title: "Sign up",
    body: "Create your account in under a minute. Pick your path: founder or cofounder.",
    detail:
      "Founders post real startups and look for the technical cofounders, founding engineers, or builders they need next to them. Builders fill out a candidate profile and get matched into early-stage startups worth joining. The two flows diverge from here.",
    visual: <StepSignup />,
  },
  {
    n: "2",
    title: "Add credentials",
    body: "Drop your LinkedIn, upload a resume, or both.",
    detail:
      "We require either to start. The more signal we have, the faster verification clears. Both is strongly recommended for quality candidates we surface to founders.",
    visual: <StepCredentials />,
  },
  {
    n: "3",
    title: "Get verified",
    body: "A short manual review confirms shipped work. Usually under 24 hours.",
    detail:
      "We check references, public projects, and the basics of the resume so every founder you meet on Polln8 is a vetted, real builder. Rejected? You'll get a reviewer note and a path to resubmit.",
    visual: <StepAccepted />,
  },
  {
    n: "4",
    title: "Match",
    body: "Browse a deck of cofounder candidates ranked against your profile. Three actions per card.",
    detail:
      "Connect, save, or pass. No likes, no maybes. AI ranks the deck against your skills, your startup, and what you're looking to cofound.",
    visual: <StepMatch />,
  },
  {
    n: "5",
    title: "Build",
    body: "Once you connect, you land in DMs with your cofounder. Pick up the thread and ship.",
    detail:
      "Accepted requests turn into mutual contacts. Pick up the conversation immediately, align on equity and scope, and start building the startup.",
    visual: <StepChat />,
  },
];

const HowItWorks = () => {
  usePageMeta({
    title: "How Polln8 Works | Find a Cofounder or a Startup to Join",
    description:
      "How Polln8 matches founders with vetted technical cofounders, and builders with early-stage startups worth joining. Verify, rank, connect in two clicks.",
    path: "/how",
  });
  // Land at the top of the page when the user navigates here from
  // the homepage's "See full flow" link. React Router preserves
  // scroll otherwise, which would dump them at the bottom.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground"
    >
      {SHOW_SIDEBAR && <Sidebar />}
      <div
        className={SHOW_SIDEBAR ? "transition-[padding] duration-200 ease-out" : ""}
        style={SHOW_SIDEBAR ? { paddingLeft: "var(--sidebar-width, 0px)" } : undefined}
      >
      <div className="mx-auto w-full max-w-5xl px-6 md:px-10 pt-12 pb-20 md:pt-16 md:pb-24">
        <Reveal>
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl md:text-6xl tracking-[-0.04em] leading-[0.95] mb-6">
              Find a cofounder.<br />Find a startup to join.
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-20 leading-relaxed">
              Five steps from signup to your first match. Polln8 verifies
              startup builders, ranks them against what you're building or
              what you'd want to join, and connects founders with vetted
              technical cofounders or builders with early-stage startups
              worth joining.
            </p>
          </div>
        </Reveal>

        <div className="space-y-28 md:space-y-36">
          {STEPS.map((s, i) => {
            const reverse = i % 2 === 1;
            return (
              <Reveal key={s.n} delay={i * 60}>
                <article className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
                  <div
                    className={`text-center lg:text-left ${
                      reverse ? "lg:order-2" : ""
                    }`}
                  >
                    <h2 className="font-display text-3xl md:text-5xl tracking-[-0.03em] mb-4">
                      <span className="font-bold text-primary mr-2">{s.n}.</span>
                      {s.title}
                    </h2>
                    <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-3 max-w-md mx-auto lg:mx-0">
                      {s.body}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                      {s.detail}
                    </p>
                  </div>
                  <div
                    className={`relative w-full max-w-full overflow-hidden ${reverse ? "lg:order-1" : ""}`}
                  >
                    <div className="relative left-1/2 w-fit -translate-x-1/2">
                      {s.visual}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-32 pt-10 border-t border-border flex flex-col lg:flex-row items-center lg:justify-between gap-6 text-center lg:text-left">
            <p className="text-base md:text-lg text-muted-foreground max-w-md">
              That's it. The rest is up to you.
            </p>
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-base font-medium text-primary transition-colors hover:opacity-80"
            >
              Start the flow
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {/* Back to homepage - primary pill, centered. */}
        <div className="mt-16 flex justify-center">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to homepage
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HowItWorks;
