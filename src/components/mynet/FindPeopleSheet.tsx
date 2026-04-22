import { useMemo } from "react";
import { Bookmark, BookmarkCheck, Check, Sparkles, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BUILDERS } from "@/lib/builders";
import { hasAnyCriteria, scoreMatch } from "@/lib/matching";
import type { Project } from "@/lib/mynet-types";

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
  const ranked = useMemo(() => {
    if (!project) return [];
    const criteria = project.criteria;
    const noCriteria = !hasAnyCriteria(criteria);
    const scored = BUILDERS.map((b) => scoreMatch(b, criteria));
    if (noCriteria) return scored;
    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [project]);

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
              ? "No criteria set yet. Showing all builders. Edit the project to narrow it down."
              : "Ranked by overlap with your project criteria."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {ranked.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No builders match these criteria. Loosen them and try again.
            </div>
          )}

          {ranked.map(({ builder, score, matchedSkills }) => {
            const saved = project?.savedPersonIds.includes(builder.id);
            const passed = project?.passedPersonIds.includes(builder.id);

            return (
              <article
                key={builder.id}
                className={`group relative rounded-sm border border-border bg-card overflow-hidden transition-all ${
                  passed ? "opacity-50" : ""
                }`}
              >
                <div className="flex gap-4 p-5">
                  <img
                    src={builder.image}
                    alt={builder.name}
                    className="h-20 w-20 object-cover rounded-sm flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-display text-xl leading-tight">
                        {builder.name}
                      </h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-gold/10 border border-gold/30 flex-shrink-0">
                        <span className="font-mono text-[10px] text-gold">
                          {score}% MATCH
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {builder.role}
                    </p>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1">
                      {builder.location} · {builder.commitment}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 space-y-3">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {builder.proof}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {builder.skills.map((s) => {
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

                  <div className="flex items-center gap-2 pt-2">
                    {saved ? (
                      <Button
                        variant="outlineGold"
                        size="sm"
                        onClick={() => onSave(builder.id)}
                        className="flex-1"
                      >
                        <BookmarkCheck className="h-4 w-4" />
                        Saved
                      </Button>
                    ) : (
                      <Button
                        variant="outlineGold"
                        size="sm"
                        onClick={() => onSave(builder.id)}
                        className="flex-1"
                      >
                        <Bookmark className="h-4 w-4" />
                        Save
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPass(builder.id)}
                      aria-label={passed ? "Restore" : "Pass"}
                    >
                      {passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
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
