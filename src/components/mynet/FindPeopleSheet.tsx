import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const savedScrollRef = useRef<number>(0);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
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

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return ranked.find((r) => r.candidate.userId === selectedId) ?? null;
  }, [ranked, selectedId]);

  const openDetail = (id: string) => {
    if (scrollRef.current) {
      savedScrollRef.current = scrollRef.current.scrollTop;
    }
    setSelectedId(id);
  };

  const closeDetail = () => {
    setSelectedId(null);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = savedScrollRef.current;
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-background border-l border-gold-soft p-0 flex flex-col"
      >
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {selected ? (
            <DetailView
              match={selected}
              project={project}
              onBack={closeDetail}
              onSave={onSave}
              onPass={onPass}
            />
          ) : (
            <ListView
              project={project}
              loading={loading}
              ranked={ranked}
              candidatesCount={candidates.length}
              onSelect={openDetail}
              onSave={onSave}
              onPass={onPass}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

type CandidateMatch = ReturnType<typeof scoreCandidate>;

const ListView = ({
  project,
  loading,
  ranked,
  candidatesCount,
  onSelect,
  onSave,
  onPass,
}: {
  project: Project | null;
  loading: boolean;
  ranked: CandidateMatch[];
  candidatesCount: number;
  onSelect: (id: string) => void;
  onSave: (id: string) => void;
  onPass: (id: string) => void;
}) => (
  <>
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
        <div className="text-center py-12 text-sm text-muted-foreground">
          {candidatesCount === 0
            ? "No accepted candidates are open to work yet."
            : "No candidates match these criteria. Loosen them and try again."}
        </div>
      )}

      {!loading &&
        ranked.map(({ candidate, score, matchedSkills }) => {
          const saved = project?.savedPersonIds.includes(candidate.userId);
          const passed = project?.passedPersonIds.includes(candidate.userId);
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
                onClick={() => onSelect(candidate.userId)}
                className="w-full text-left flex items-center gap-3 p-4"
                aria-label={`Open ${candidate.fullName || "candidate"} profile`}
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
  </>
);

const DetailView = ({
  match,
  project,
  onBack,
  onSave,
  onPass,
}: {
  match: CandidateMatch;
  project: Project | null;
  onBack: () => void;
  onSave: (id: string) => void;
  onPass: (id: string) => void;
}) => {
  const { candidate, score, matchedSkills } = match;
  const saved = project?.savedPersonIds.includes(candidate.userId);
  const passed = project?.passedPersonIds.includes(candidate.userId);
  const avatarUrl = getAvatarUrl(candidate.avatarPath);

  return (
    <>
      <div className="border-b border-border p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to results
        </button>

        <div className="flex gap-4 items-start">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={candidate.fullName}
              className="h-20 w-20 rounded-sm object-cover border border-gold/30 flex-shrink-0"
            />
          ) : (
            <div className="h-20 w-20 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-xl text-gold">
                {initials(candidate.fullName)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="font-display text-2xl leading-tight">
                {candidate.fullName || "Unnamed"}
              </h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-gold/10 border border-gold/30 flex-shrink-0">
                <span className="font-mono text-[10px] text-gold">
                  {score}% MATCH
                </span>
              </div>
            </div>
            {candidate.headline && (
              <p className="text-sm text-muted-foreground">
                {candidate.headline}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {(candidate.location || candidate.commitment) && (
          <div className="flex flex-wrap gap-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {candidate.commitment && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-gold" />
                {candidate.commitment}
              </span>
            )}
            {candidate.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gold" />
                {candidate.location}
              </span>
            )}
          </div>
        )}

        {candidate.bio && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Pitch
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {candidate.bio}
            </p>
          </div>
        )}

        {candidate.skills.length > 0 && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Skills
            </p>
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
          </div>
        )}

        {candidate.linkedinUrl && (
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
        )}

        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Button
            variant="outlineGold"
            size="lg"
            onClick={() => onSave(candidate.userId)}
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
            size="lg"
            onClick={() => onPass(candidate.userId)}
            aria-label={passed ? "Restore" : "Pass"}
          >
            {passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
};
