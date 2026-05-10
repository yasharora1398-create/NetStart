import { RefObject } from "react";
import { useInView } from "@/hooks/useInView";

interface Item {
  n: string;
  title: string;
  body: string;
}

const ITEMS: Item[] = [
  {
    n: "01",
    title: "Vetted, not viral",
    body: "Every member is reviewed for shipped work, references, and execution signal. No growth-hacked accounts.",
  },
  {
    n: "02",
    title: "Skill, not surface",
    body: "Matching prioritizes complementary capability over background, school, or city. Builders find counterweights.",
  },
  {
    n: "03",
    title: "Decisive by design",
    body: "Connect, pass, or save. No likes, no maybes. Your time is the asset we protect.",
  },
];

interface CardProps {
  item: Item;
  index: number;
  scrollRoot?: RefObject<Element | null>;
}

const WhyCard = ({ item, index, scrollRoot }: CardProps) => {
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.35,
    root: scrollRoot,
    rootMargin: "0px 0px -5% 0px",
  });

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-3xl border-2 border-foreground/15 bg-card/80 p-6 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        inView
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-10 [filter:blur(8px)]"
      }`}
      style={{ transitionDelay: `${index * 110}ms` }}
    >
      <div className="flex items-start gap-4">
        <span className="font-display text-sm font-black tracking-[0.2em] text-primary-glow">
          {item.n}
        </span>
        <div className="flex-1">
          <h3 className="font-display text-xl font-black leading-tight">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary-soft">{item.body}</p>
        </div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl"
      />
    </div>
  );
};

interface WhySectionProps {
  scrollRoot?: RefObject<Element | null>;
}

export const WhySection = ({ scrollRoot }: WhySectionProps) => {
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.5,
    root: scrollRoot,
  });

  return (
    <section className="mt-10">
      <div
        ref={ref}
        className={`mb-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <p className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-tertiary">
          Why NetStart
        </p>
        <h2 className="mt-1 font-display text-2xl font-black leading-tight tracking-tight">
          Built for people who ship.
        </h2>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item, i) => (
          <WhyCard key={item.n} item={item} index={i} scrollRoot={scrollRoot} />
        ))}
      </div>
    </section>
  );
};
