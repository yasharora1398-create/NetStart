import { BadgeCheck, FileText, Linkedin, UserX } from "lucide-react";
import { FadeUp } from "@/components/netstart/FadeUp";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

/**
 * "Why verified" - the differentiator section. Two halves:
 *
 *   1. A side-by-side comparison illustration: what cofounder hunting
 *      looks like on an open forum (spam, ghosting, recruiters)
 *      versus what a verified Polln8 profile looks like. Both are
 *      realistic product-style vignettes built from the same UI
 *      language as the app, so they read as screenshots rather than
 *      clip-art.
 *
 *   2. Three pillars explaining what verification actually means,
 *      each with an animated checklist illustration.
 *
 * Everything reveals on scroll via FadeUp staggers; the checkmarks
 * draw themselves in (stroke-dashoffset) when they enter the
 * viewport.
 */

// Animated check: the stroke draws itself when scrolled into view.
const DrawCheck = ({ delay = 0 }: { delay?: number }) => {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.5 });
  return (
    <span
      ref={ref}
      className="inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0"
      style={{ background: "hsl(var(--primary))" }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.5 L5 9 L9.5 3.5"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 14,
            strokeDashoffset: inView ? 0 : 14,
            transition: `stroke-dashoffset 600ms ease ${delay}ms`,
          }}
        />
      </svg>
    </span>
  );
};

// ─── Left vignette: the open forum ──────────────────────────────
// A realistic forum-thread card: an earnest post drowning in the
// three classic replies - the recruiter, the idea guy, the ghost.
const ForumVignette = () => (
  <div className="rounded-sm border border-border bg-background p-5 h-full">
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
      Anywhere else
    </p>

    {/* The post */}
    <div className="rounded-sm border border-border bg-card p-4 mb-3">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
          ?
        </span>
        <div>
          <p className="text-[13px] font-semibold leading-tight">
            u/serious_founder
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            posted 3 weeks ago · still looking
          </p>
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        [Technical] Looking for a cofounder. Real product, first paying
        customers, can share traction privately…
      </p>
    </div>

    {/* The replies */}
    <div className="space-y-2 pl-4 border-l border-border">
      <div className="rounded-sm border border-border bg-card px-3.5 py-2.5 flex items-start gap-2.5">
        <UserX className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          "Great opportunity! I run a dev agency that can build your MVP
          for $15k…"
        </p>
      </div>
      <div className="rounded-sm border border-border bg-card px-3.5 py-2.5 flex items-start gap-2.5">
        <UserX className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          "I have 10 ideas better than this, DM me" · no profile, no
          work, no replies since
        </p>
      </div>
      <div className="rounded-sm border border-dashed border-border px-3.5 py-2.5">
        <p className="text-[12px] text-muted-foreground leading-relaxed italic">
          The promising one read your message 6 days ago.
        </p>
      </div>
    </div>

    <p className="mt-4 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
      No review · no identity · no follow-through
    </p>
  </div>
);

// ─── Right vignette: a verified Polln8 profile ──────────────────
// The same person, but vetted: badge, cross-checked links, reviewer
// stamp. This is what the deck is made of.
const VerifiedVignette = () => (
  <div className="rounded-sm border border-gold bg-background p-5 h-full">
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold mb-4">
      On Polln8
    </p>

    <div className="rounded-sm border border-border bg-card p-4 mb-3">
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-white"
          style={{ background: "hsl(var(--primary))" }}
        >
          SO
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-tight flex items-center gap-1.5">
            Sam Ortiz
            <BadgeCheck
              className="h-4 w-4 shrink-0"
              style={{ color: "hsl(var(--primary))" }}
            />
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Founder · B2B logistics · $12K MRR
          </p>
        </div>
      </div>

      {/* The cross-check rows - each one draws its check on scroll. */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 rounded-sm border border-border bg-background px-3 py-2">
          <DrawCheck delay={0} />
          <Linkedin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] leading-tight">
            LinkedIn matches the story
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-sm border border-border bg-background px-3 py-2">
          <DrawCheck delay={150} />
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] leading-tight">
            Résumé checked against shipped work
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-sm border border-border bg-background px-3 py-2">
          <DrawCheck delay={300} />
          <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] leading-tight">
            Public work is real and theirs
          </span>
        </div>
      </div>
    </div>

    {/* Reviewer stamp */}
    <div className="rounded-sm border border-border bg-card px-3.5 py-2.5 flex items-center justify-between gap-3">
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Approved by a human reviewer
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        cleared in 14h
      </p>
    </div>

    <p className="mt-4 text-[11px] font-mono uppercase tracking-[0.18em] text-gold">
      Reviewed · cross-checked · accountable
    </p>
  </div>
);

// ─── Pillars ─────────────────────────────────────────────────────
const PILLARS: { title: string; body: string }[] = [
  {
    title: "A human, not a filter.",
    body: "Every profile is read by a person before it enters anyone's deck. Not a keyword scan, not an auto-approval queue. Someone looks at the work and decides.",
  },
  {
    title: "Claims get cross-checked.",
    body: "Your LinkedIn, your résumé, and your public work have to tell the same story. \"Ex-Google\" with no trace of it doesn't clear the bar.",
  },
  {
    title: "Rejection comes with a reason.",
    body: "Profiles that don't clear get a reviewer note and a resubmit path. Recruiters and agencies don't get one. They're out, permanently.",
  },
];

const WhyVerified = () => {
  return (
    <section className="px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold mb-3">
            Why verified
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4 max-w-3xl leading-[1.05] font-bold">
            The deck is only as good as who gets in.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-14">
            Anyone can build a swipe UI. The hard part is making sure the
            person on the card is real, serious, and who they say they
            are. That's the part we do by hand, and it's the difference
            between a network and a feed.
          </p>
        </FadeUp>

        {/* Comparison: open forum vs verified profile, sliding in
            from opposite sides. */}
        <div className="grid gap-5 lg:grid-cols-2 mb-16 items-stretch">
          <FadeUp from="left" durationMs={800} className="h-full">
            <ForumVignette />
          </FadeUp>
          <FadeUp from="right" durationMs={800} delay={150} className="h-full">
            <VerifiedVignette />
          </FadeUp>
        </div>

        {/* Three pillars of what verification means. */}
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <FadeUp
              key={p.title}
              from="scale"
              durationMs={800}
              delay={i * 120}
              className="h-full"
            >
              <article className="h-full rounded-sm border border-border bg-card p-6">
                <p className="font-display text-4xl text-gold mb-4 leading-none font-bold">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display text-xl mb-2.5 leading-tight font-semibold">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.body}
                </p>
              </article>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={200}>
          <p
            className={cn(
              "mt-12 text-center text-sm text-muted-foreground",
            )}
          >
            100% of members reviewed by a human · average review under 24
            hours · zero recruiters allowed
          </p>
        </FadeUp>
      </div>
    </section>
  );
};

export default WhyVerified;
