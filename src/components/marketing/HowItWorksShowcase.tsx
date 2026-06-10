import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ReviewCardMockup,
  MatchesCardMockup,
  RequestCardMockup,
} from "@/components/marketing/WhySection";

/**
 * Home-page "How it works" - replaces the old zig-zag WhySection
 * layout on the homepage only (Waitlist still uses the zig-zag).
 *
 * Layout: 40% left column with the three step boxes stacked, 60%
 * right column showing ONE animation at a time. Clicking a box on
 * the left makes it the active step: the box grows slightly, its
 * detail bullets expand out, and the matching animation mounts on
 * the right (mounting restarts the mockup's auto-loop from frame
 * zero, so the animation always plays from the start of its story).
 */
const STEPS: {
  eyebrow: string;
  title: string;
  body: string;
  details: string[];
}[] = [
  {
    eyebrow: "Step 1 · Review",
    title: "Every signup gets a real review.",
    body: "A human looks at your LinkedIn, your resume, and your public work before you ever see the deck.",
    details: [
      "Manual review of every signup, not auto-approval.",
      "LinkedIn and resume cross-checked against public work.",
      "Rejected applicants get a reviewer note and a resubmit path.",
    ],
  },
  {
    eyebrow: "Step 2 · Match",
    title: "The deck is ranked against what you've built.",
    body: "Profiles and projects get embedded into vectors and ordered by real similarity to your work, not engagement metrics.",
    details: [
      "Embeddings of your profile and project intent drive ranking.",
      "Skills weighted by what you've actually shipped, not claimed.",
      "Re-ranks daily as profiles and projects update.",
    ],
  },
  {
    eyebrow: "Step 3 · Connect",
    title: "Three actions per card. That's it.",
    body: "Connect, save, or pass. No likes, no maybes, no fourth bucket to delay the decision.",
    details: [
      "Three actions per card. No fourth option to defer.",
      "One pitch per request, no copy-paste spam.",
      "Accepted requests turn into mutual contacts immediately.",
    ],
  },
];

const HowItWorksShowcase = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="border-y border-border bg-card px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4 max-w-3xl leading-[1.05] font-bold">
          How it works.
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-12">
          Three steps from stranger to teammate. Click a step to watch
          exactly what happens on screen.
        </p>

        <div className="grid gap-8 lg:gap-14 lg:grid-cols-[40fr_60fr] items-center">
          {/* Left 40%: the three step boxes, stacked. The active one
              grows a touch, turns gold at the border, and its extra
              bullet points slide out. */}
          <div className="flex flex-col gap-4">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-expanded={isActive}
                  className={cn(
                    "text-left rounded-sm border bg-background p-6 transition-all duration-300 ease-out",
                    isActive
                      ? "border-gold scale-[1.02] shadow-sm"
                      : "border-border hover:border-gold/60 scale-100",
                  )}
                >
                  <p
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.22em] mb-2 transition-colors",
                      isActive ? "text-gold" : "text-muted-foreground",
                    )}
                  >
                    {s.eyebrow}
                  </p>
                  <h3 className="font-display text-xl md:text-2xl mb-2 leading-tight font-semibold">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.body}
                  </p>

                  {/* Extra bullets - collapsed to zero rows unless this
                      box is the active one. */}
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-500 ease-out",
                      isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <ul
                        className={cn(
                          "space-y-2 border-l border-gold pl-4 mt-4 transition-opacity duration-500",
                          isActive ? "opacity-100 delay-100" : "opacity-0",
                        )}
                      >
                        {s.details.map((d) => (
                          <li
                            key={d}
                            className="text-sm leading-relaxed text-muted-foreground"
                          >
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right 60%: exactly one animation at a time. key={active}
              remounts the wrapper so the fade-in plays and the mockup
              loop restarts from its first frame. Hidden below lg -
              tablet portrait gets the text boxes only. */}
          <div className="hidden lg:flex items-center justify-center min-h-[480px]">
            <div key={active} className="hiw-fade w-full flex justify-center">
              {active === 0 && <ReviewCardMockup />}
              {active === 1 && <MatchesCardMockup persona="partner" />}
              {active === 2 && <RequestCardMockup persona="partner" />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksShowcase;
