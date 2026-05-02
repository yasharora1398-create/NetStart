import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";

const PRINCIPLES = [
  {
    title: "Vetted, not viral.",
    body: "Every member is reviewed for shipped work, references, and a track record of execution. We don't grow off engagement metrics or referral chains. The network shrinks if it has to.",
    detail: [
      "Resume or LinkedIn required at signup.",
      "Manual review by the operator team before access.",
      "Resubmissions and audits whenever the signal drops.",
    ],
  },
  {
    title: "Skill, not surface.",
    body: "Matching prioritizes complementary capability over background, school, or city. The right co-founder for a Rust infra startup is a senior systems engineer, not the loudest 'building in public' account.",
    detail: [
      "AI-ranked recommendations based on your work, not your resume keywords.",
      "Filters for skill and commitment first; geography second.",
      "Profiles surface proof of work above credentials.",
    ],
  },
  {
    title: "Decisive by design.",
    body: "Connect, pass, save. No likes, no maybes. Every interaction is a deliberate choice — your time is the asset we protect most.",
    detail: [
      "Three actions per profile and that's it.",
      "Apply once with a real pitch, not a template.",
      "Founders accept or reject; operators get a clear answer.",
    ],
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

const Standards = () => (
  <div
    className="min-h-screen bg-background text-foreground"
    style={{ overflowX: "clip" }}
  >
    <Sidebar />
    <div
      className="transition-[padding] duration-300"
      style={{ paddingLeft: "var(--sidebar-width, 248px)" }}
    >
      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-6 pb-20 md:pt-10 md:pb-24">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-5">
            Standards
          </p>
          <h1 className="font-display text-5xl md:text-7xl tracking-[-0.04em] leading-[0.95] mb-8">
            Three rules.<br />Nothing else.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-20 leading-relaxed">
            We held the network to a high bar from day one. Here's
            exactly what that means in practice.
          </p>
        </Reveal>

        <div className="space-y-24 md:space-y-32">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <article className="grid md:grid-cols-[140px_1fr] gap-8 md:gap-14 items-start">
                <span className="font-display text-stroke text-7xl md:text-[8rem] leading-none tracking-[-0.05em] select-none">
                  0{i + 1}
                </span>
                <div>
                  <h2 className="font-display text-3xl md:text-5xl tracking-[-0.03em] mb-5">
                    {p.title}
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                    {p.body}
                  </p>
                  <ul className="space-y-2">
                    {p.detail.map((d) => (
                      <li
                        key={d}
                        className="flex items-baseline gap-3 text-sm text-foreground/80"
                      >
                        <span className="text-blue-400 font-mono text-xs">
                          —
                        </span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-32 pt-10 border-t border-white/10">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-base font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Apply to join
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  </div>
);

export default Standards;
