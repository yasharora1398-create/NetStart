import { useEffect, useState } from "react";
import { X } from "lucide-react";

const LS_KEY = "netstart_tour_seen";

type Step = {
  label: string;
  title: string;
  body: string;
  scrollTarget?: string;
};

const STEPS: Step[] = [
  {
    label: "1 of 4",
    title: "Meet the app",
    body: "The iPhone on the right is a live preview. Tap the blue target to connect with a builder you like, or the X to pass. Swipe through a few while you read.",
  },
  {
    label: "2 of 4",
    title: "What we stand for",
    body: "Three rules keep the network useful. Every member is reviewed for real work, matching cares about skill instead of surface, and your time is protected.",
    scrollTarget: "#standards",
  },
  {
    label: "3 of 4",
    title: "Getting in",
    body: "Sign up, link your proof of work, get verified. Once you are in, you are matched with people who can actually build what you are building.",
    scrollTarget: "#how",
  },
  {
    label: "4 of 4",
    title: "When you are ready",
    body: "Grab the app for iOS or Android from the download section. You can keep exploring first if you like. That is the tour.",
    scrollTarget: "#download",
  },
];

type Stage = "hidden" | "welcome" | number;

export const Tutorial = () => {
  const [stage, setStage] = useState<Stage>("hidden");

  useEffect(() => {
    const seen = typeof window !== "undefined" && window.localStorage.getItem(LS_KEY) === "1";
    setStage(seen ? "hidden" : "welcome");
  }, []);

  useEffect(() => {
    if (typeof stage === "number") {
      const target = STEPS[stage]?.scrollTarget;
      if (target) {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [stage]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(LS_KEY, "1");
    } catch {
      // ignore storage errors
    }
    setStage("hidden");
  };

  const start = () => setStage(0);

  const next = () => {
    if (typeof stage !== "number") return;
    if (stage >= STEPS.length - 1) {
      dismiss();
    } else {
      setStage(stage + 1);
    }
  };

  if (stage === "hidden") return null;

  const cardClass =
    "relative bg-obsidian/95 backdrop-blur-xl border border-gold/30 rounded-sm p-5 shadow-elite w-[90vw] max-w-sm";

  if (stage === "welcome") {
    return (
      <div className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50 animate-fade-up">
        <div className={cardClass}>
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">New here?</p>
          <h4 className="font-display text-xl mb-2 pr-6">Welcome.</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Take a quick tour and we will walk you through how this works. Takes about thirty seconds.
          </p>
          <button
            onClick={start}
            className="w-full bg-gradient-gold text-primary-foreground font-medium text-sm py-2.5 rounded-sm hover:shadow-glow transition-shadow"
          >
            Show me around
          </button>
        </div>
      </div>
    );
  }

  const step = STEPS[stage];
  const isLast = stage === STEPS.length - 1;

  return (
    <div className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50 animate-fade-up">
      <div className={cardClass}>
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">{step.label}</p>
        <h4 className="font-display text-xl mb-2 pr-6">{step.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.body}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={dismiss}
            className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground py-2 px-3 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={next}
            className="flex-1 bg-gradient-gold text-primary-foreground font-medium text-sm py-2.5 rounded-sm hover:shadow-glow transition-shadow"
          >
            {isLast ? "Got it" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};
