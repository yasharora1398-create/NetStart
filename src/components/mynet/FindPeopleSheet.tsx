import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Check,
  ChevronRight,
  ExternalLink,
  Linkedin,
  Loader2,
  MapPin,
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isAiConfigured } from "@/lib/ai";
import { hasAnyCriteria, scoreCandidate } from "@/lib/matching";
import {
  getAvatarUrl,
  listOpenCandidates,
  matchCandidatesForProject,
} from "@/lib/mynet-storage";
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
  const [candidates, setCandidates] = useState<
    Array<Candidate & { similarity?: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usingAi, setUsingAi] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !project) {
      setSelectedId(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const useAi = isAiConfigured();
    setUsingAi(useAi);
    const loader = useAi
      ? matchCandidatesForProject(project.id)
      : listOpenCandidates();
    loader
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
  }, [open, project]);

  const ranked = useMemo(() => {
    if (!project) return [];
    const noCriteria = !hasAnyCriteria(project.criteria);
    const scored = candidates.map((c) => {
      const local = scoreCandidate(c, project.criteria);
      const aiScore = (c.similarity ?? 0) * 100;
      const blended = usingAi && aiScore > 0
        ? Math.round(local.score * 0.4 + aiScore * 0.6)
        : local.score;
      return { ...local, score: blended };
    });
    if (noCriteria && !usingAi) return scored;
    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [project, candidates, usingAi]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return ranked.find((r) => r.candidate.userId === selectedId) ?? null;
  }, [ranked, selectedId]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl bg-background border-l border-gold-soft p-0 flex flex-col"
        >
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <SheetHeader className="border-b border-border p-6">
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
                  : "Tap a candidate for the full profile."}
              </SheetDescription>
            </SheetHeader>

            <div className="p-6 space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 text-gold animate-spin" />
                </div>
              )}

              {!loading && ranked.length === 0 && (
                <div className="text-center py-12 px-4">
                  <Sparkles className="h-5 w-5 text-gold mx-auto mb-3" />
                  <h3 className="font-display text-lg mb-2">
                    {candidates.length === 0
                      ? "No candidates yet"
                      : "Nothing matches"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {candidates.length === 0
                      ? "Be early. Once accepted operators flip Open to work, they'll show up here ranked against your project."
                      : "Loosen the criteria on this project and try again."}
                  </p>
                </div>
              )}

              {!loading &&
                ranked.map(({ candidate, score, matchedSkills }) => {
                  const saved = project?.savedPersonIds.includes(
                    candidate.userId,
                  );
                  const passed = project?.passedPersonIds.includes(
                    candidate.userId,
                  );
                  const avatarUrl = getAvatarUrl(candidate.avatarPath);

                  return (
                    <article
                      key={candidate.userId}
                      className={`group relative rounded-sm border border-border bg-card hover:border-gold/50 transition-colors ${
                        passed ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(candidate.userId)}
                        className="w-full text-left flex items-center gap-3 p-4"
                        aria-label={`Open ${
                          candidate.fullName || "candidate"
                        } profile`}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={candidate.fullName}
                            className="h-12 w-12 rounded-sm object-cover border border-gold/30 flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                            <span className="font-display text-base text-gold">
                              {initials(candidate.fullName)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="font-display text-base leading-tight truncate">
                              {candidate.fullName || "Unnamed"}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded-sm bg-gold/10 border border-gold/30 font-mono text-[10px] text-gold flex-shrink-0">
                              {score}%
                            </span>
                          </div>
                          {candidate.headline && (
                            <p className="text-xs text-muted-foreground truncate">
                              {candidate.headline}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
                      </button>

                      <div className="px-4 pb-3 flex items-center gap-2 border-t border-border/60 pt-3">
                        <Button
                          variant="outlineGold"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSave(candidate.userId);
                          }}
                          className="flex-1"
                        >
                          {saved ? (
                            <>
                              <BookmarkCheck className="h-4 w-4" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPass(candidate.userId);
                          }}
                          aria-label={passed ? "Restore" : "Pass"}
                        >
                          {passed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {matchedSkills.length > 0 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1">
                          {matchedSkills.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 text-[10px] rounded-sm border border-gold/40 bg-gold/5"
                            >
                              {s}
                            </span>
                          ))}
                          {matchedSkills.length > 4 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{matchedSkills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CandidateProfileModal
        match={selected}
        project={project}
        onClose={() => setSelectedId(null)}
        onSave={onSave}
        onPass={onPass}
      />
    </>
  );
};

type CandidateMatch = ReturnType<typeof scoreCandidate>;

const CandidateProfileModal = ({
  match,
  project,
  onClose,
  onSave,
  onPass,
}: {
  match: CandidateMatch | null;
  project: Project | null;
  onClose: () => void;
  onSave: (id: string) => void;
  onPass: (id: string) => void;
}) => {
  const open = Boolean(match);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="p-0 bg-card border-gold-soft w-[95vw] sm:w-[min(60vw,800px)] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col"
      >
        <DialogTitle className="sr-only">
          {match?.candidate.fullName || "Candidate profile"}
        </DialogTitle>
        {match && (
          <PublicProfileBody
            match={match}
            project={project}
            onSave={onSave}
            onPass={onPass}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const PublicProfileBody = ({
  match,
  project,
  onSave,
  onPass,
}: {
  match: CandidateMatch;
  project: Project | null;
  onSave: (id: string) => void;
  onPass: (id: string) => void;
}) => {
  const { candidate, score, matchedSkills } = match;
  const saved = project?.savedPersonIds.includes(candidate.userId);
  const passed = project?.passedPersonIds.includes(candidate.userId);
  const avatarUrl = getAvatarUrl(candidate.avatarPath);

  const totalSkills = candidate.skills.length;
  const matchedCount = matchedSkills.length;
  const requiredCount = project?.criteria.skills.length ?? 0;

  return (
    <>
      <div className="relative px-8 pt-8 pb-6 border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
        <div className="relative flex items-start gap-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={candidate.fullName}
              className="h-24 w-24 rounded-sm object-cover border border-gold/40 flex-shrink-0"
            />
          ) : (
            <div className="h-24 w-24 rounded-sm bg-gold/10 border border-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-3xl text-gold">
                {initials(candidate.fullName)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1">
              Public profile
            </p>
            <h2 className="font-display text-3xl md:text-4xl leading-tight mb-1">
              {candidate.fullName || "Unnamed"}
            </h2>
            {candidate.headline && (
              <p className="text-sm text-muted-foreground mb-4">
                {candidate.headline}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm border border-gold/40 bg-gold/10 font-mono text-[11px] text-gold uppercase tracking-widest">
                {score}% match
              </span>
              {requiredCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {matchedCount}/{requiredCount} skills
                </span>
              )}
              {candidate.commitment && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Briefcase className="h-3 w-3 text-gold" />
                  {candidate.commitment}
                </span>
              )}
              {candidate.location && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <MapPin className="h-3 w-3 text-gold" />
                  {candidate.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {candidate.bio ? (
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
              Pitch
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {candidate.bio}
            </p>
          </section>
        ) : (
          <section className="rounded-sm border border-dashed border-border bg-background/40 p-4">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              No pitch yet
            </p>
          </section>
        )}

        {totalSkills > 0 && (
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
              Skills{" "}
              <span className="text-muted-foreground normal-case tracking-normal">
                ({totalSkills})
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((s) => {
                const isMatch = matchedSkills.includes(s);
                return (
                  <span
                    key={s}
                    className={`px-2.5 py-1 text-xs rounded-sm border ${
                      isMatch
                        ? "border-gold/50 bg-gold/10 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {s}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {candidate.linkedinUrl && (
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
              Contact
            </p>
            <a
              href={candidate.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
            >
              <Linkedin className="h-4 w-4" />
              {candidate.linkedinUrl}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </section>
        )}
      </div>

      <div className="border-t border-border bg-background/40 px-8 py-4 flex items-center gap-2">
        <Button
          variant="outlineGold"
          size="lg"
          onClick={() => onSave(candidate.userId)}
          className="flex-1"
        >
          {saved ? (
            <>
              <BookmarkCheck className="h-4 w-4" />
              Saved to project
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              Save to project
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onPass(candidate.userId)}
          aria-label={passed ? "Restore" : "Pass"}
        >
          {passed ? (
            <>
              <Check className="h-4 w-4" />
              Restore
            </>
          ) : (
            <>
              <X className="h-4 w-4" />
              Pass
            </>
          )}
        </Button>
      </div>
    </>
  );
};
