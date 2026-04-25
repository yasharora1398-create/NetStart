import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  Linkedin,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { hasAnyCriteria, scoreCandidate } from "@/lib/matching";
import { getAvatarUrl, listOpenCandidates } from "@/lib/mynet-storage";
import type { Candidate, Project } from "@/lib/mynet-types";

const initials = (name: string): string => {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

type FindPeopleSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (personId: string) => void;
  onPass: (personId: string) => void;
};

export const FindPeopleSheet = ({
  open,
  onOpenChange,
  project,
  onSave,
  onPass,
}: FindPeopleSheetProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listOpenCandidates()
      .then((list) => {
        if (!cancelled) setCandidates(list);
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const ranked = useMemo(() => {
    if (!project) return [];
    const noCriteria = !hasAnyCriteria(project.criteria);
    const scored = candidates.map((c) => scoreCandidate(c, project.criteria));
    if (noCriteria) return scored;
    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [project, candidates]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-background border-l border-gold-soft overflow-y-auto"
      >
        <SheetHeader className="border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-3 self-start">
            <Sparkles className="h-3 w-3 text-gold" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
              Matching against {project?.title ?? "project"}
            </span>
          </div>
          <SheetTitle className="font-display text-3xl leading-[1] text-left">
            Find people
          </SheetTitle>
          <SheetDescription className="text-left text-sm text-muted-foreground">
            {project && !hasAnyCriteria(project.criteria)
              ? "No criteria set. Showing every operator open to work."
              : "Ranked by overlap with your project criteria."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            </div>
          )}

          {!loading && ranked.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {candidates.length === 0
                ? "No accepted candidates are open to work yet."
                : "No candidates match these criteria. Loosen them and try again."}
            </div>
          )}

          {!loading &&
            ranked.map(({ candidate, score, matchedSkills }) => {
              const saved = project?.savedPersonIds.includes(candidate.userId);
              const passed = project?.passedPersonIds.includes(candidate.userId);

              return (
                <article
                  key={candidate.userId}
                  className={`group relative rounded-sm border border-border bg-card overflow-hidden transition-all ${
                    passed ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex gap-4 p-5">
                    {(() => {
                      const url = getAvatarUrl(candidate.avatarPath);
                      return url ? (
                        <img
                          src={url}
                          alt={candidate.fullName}
                          className="h-16 w-16 rounded-sm object-cover border border-gold/30 flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                          <span className="font-display text-lg text-gold">
                            {initials(candidate.fullName)}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-display text-xl leading-tight">
                          {candidate.fullName || "Unnamed"}
                        </h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-gold/10 border border-gold/30 flex-shrink-0">
                          <span className="font-mono text-[10px] text-gold">
                            {score}% MATCH
                          </span>
                        </div>
                      </div>
                      {candidate.headline && (
                        <p className="text-sm text-muted-foreground truncate">
                          {candidate.headline}
                        </p>
                      )}
                      {(candidate.location || candidate.commitment) && (
                        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1">
                          {[candidate.location, candidate.commitment]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5 space-y-3">
                    {candidate.bio && (
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {candidate.bio}
                      </p>
                    )}

                    {candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.map((s) => {
                          const isMatch = matchedSkills.includes(s);
                          return (
                            <span
                              key={s}
                              className={`px-2 py-0.5 text-[11px] rounded-sm border ${
                                isMatch
                                  ? "border-gold/50 bg-gold/10 text-foreground"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {candidate.linkedinUrl && (
                      <a
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-gold hover:underline"
                      >
                        <Linkedin className="h-3 w-3" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {saved ? (
                        <Button
                          variant="outlineGold"
                          size="sm"
                          onClick={() => onSave(candidate.userId)}
                          className="flex-1"
                        >
                          <BookmarkCheck className="h-4 w-4" />
                          Saved
                        </Button>
                      ) : (
                        <Button
                          variant="outlineGold"
                          size="sm"
                          onClick={() => onSave(candidate.userId)}
                          className="flex-1"
                        >
                          <Bookmark className="h-4 w-4" />
                          Save
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPass(candidate.userId)}
                        aria-label={passed ? "Restore" : "Pass"}
                      >
                        {passed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
