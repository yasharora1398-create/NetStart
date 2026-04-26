import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  candidateGapLabel,
  candidateGaps,
  isCandidateProfileComplete,
  type Profile,
  type Project,
} from "@/lib/mynet-types";

type Step = {
  key: string;
  label: string;
  done: boolean;
  pending?: boolean;
  hint?: string;
  failed?: boolean;
};

type OnboardingChecklistProps = {
  profile: Profile;
  projects: Project[];
};

export const OnboardingChecklist = ({
  profile,
  projects,
}: OnboardingChecklistProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const steps: Step[] = useMemo(() => {
    const submitted = profile.reviewStatus !== "draft";
    const accepted = profile.reviewStatus === "accepted";
    const rejected = profile.reviewStatus === "rejected";
    const pending = profile.reviewStatus === "pending";

    const profileComplete = isCandidateProfileComplete(profile.candidate);
    const gaps = candidateGaps(profile.candidate);
    const gapText = gaps
      .map((g) => candidateGapLabel(g, profile.candidate))
      .join(", ");
    const hasOpenToWork = profile.candidate.isOpenToWork && profileComplete;

    const ownsProject = projects.length > 0;
    const hasPublished = projects.some((p) => p.isPublished);

    return [
      {
        key: "submit",
        label: "Submit your credentials for review",
        done: submitted,
        hint: submitted ? undefined : "Add LinkedIn or resume above and submit.",
      },
      {
        key: "review",
        label: rejected
          ? "Update credentials and resubmit"
          : "Get accepted by the reviewer",
        done: accepted,
        pending: pending,
        failed: rejected,
        hint: rejected
          ? profile.reviewReason || undefined
          : pending
            ? "We're reviewing your submission. You'll get a notification."
            : undefined,
      },
      {
        key: "candidate-profile",
        label: "Fill out your candidate profile",
        done: accepted && profileComplete,
        hint: !accepted
          ? undefined
          : profileComplete
            ? undefined
            : `Still need: ${gapText}.`,
      },
      {
        key: "act",
        label: "Go live: publish a project or open to work",
        done: accepted && (hasPublished || hasOpenToWork),
        hint: !accepted
          ? undefined
          : hasPublished || hasOpenToWork
            ? undefined
            : ownsProject
              ? "Publish at least one project, or toggle Open to work."
              : "Create your first project, or toggle Open to work.",
      },
    ];
  }, [profile, projects]);

  const completedCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = completedCount === total;

  const pct = Math.round((completedCount / total) * 100);

  return (
    <div className="relative rounded-sm border border-gold-soft bg-gradient-to-br from-gold/5 to-transparent overflow-hidden">
      <div
        className={
          allDone
            ? "pointer-events-none select-none blur-sm"
            : ""
        }
      >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-gold/5 transition-colors text-left"
        aria-expanded={!collapsed}
      >
        <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/40 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1">
            Get set up
          </p>
          <p className="text-sm">
            {completedCount} of {total} done
            <span className="text-muted-foreground"> · {pct}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-background border border-border overflow-hidden">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {!collapsed && (
        <ol className="divide-y divide-border border-t border-border">
          {steps.map((step, i) => (
            <li key={step.key} className="px-5 sm:px-6 py-3 flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {step.done ? (
                  <div className="h-5 w-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                    <Check className="h-3 w-3 text-gold" />
                  </div>
                ) : step.failed ? (
                  <div className="h-5 w-5 rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center">
                    <X className="h-3 w-3 text-destructive" />
                  </div>
                ) : step.pending ? (
                  <div className="h-5 w-5 rounded-full bg-gold/5 border border-gold/30 flex items-center justify-center">
                    <Clock className="h-3 w-3 text-gold animate-pulse" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                    <Circle className="h-2 w-2" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-tight ${
                    step.done
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {step.hint && !step.done && (
                  <p
                    className={`text-[11px] mt-1 ${
                      step.failed
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.hint}
                  </p>
                )}
              </div>
              {!step.done && !step.pending && !step.failed && i === 0 && (
                <ArrowRight className="h-3.5 w-3.5 text-gold flex-shrink-0 mt-1" />
              )}
            </li>
          ))}
        </ol>
      )}
      </div>

      {allDone && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-3/4 max-w-md rounded-sm border border-gold/50 bg-card/95 backdrop-blur-md shadow-2xl p-5 sm:p-6 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 mb-3">
              <CheckCircle2 className="h-5 w-5 text-gold" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
              All set
            </p>
            <h3 className="font-display text-xl sm:text-2xl mb-2">
              You're live on NetStart.
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Time to find your match. Browse projects or run Find People on
              one of yours.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/talent">
                <Button variant="gold" size="sm">
                  Browse projects
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
