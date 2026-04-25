import { useEffect, useState } from "react";
import { ExternalLink, Linkedin, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAvatarUrl, getCandidatesByIds } from "@/lib/mynet-storage";
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

type SavedPeopleListProps = {
  project: Project;
  onUnsave: (personId: string) => void;
};

export const SavedPeopleList = ({ project, onUnsave }: SavedPeopleListProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const ids = project.savedPersonIds.filter((id) => uuidRe.test(id));
    if (ids.length === 0) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCandidatesByIds(ids)
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
  }, [project.savedPersonIds]);

  if (loading) {
    return (
      <div className="rounded-sm border border-border bg-card/40 p-10 text-center">
        <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card/40 p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
          Empty
        </p>
        <p className="text-sm text-muted-foreground">
          Tap Find people on this project to start saving operators.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {candidates.map((c) => (
        <article
          key={c.userId}
          className="rounded-sm border border-border bg-card hover:border-gold/40 transition-colors overflow-hidden"
        >
          <div className="flex gap-4 p-5">
            {(() => {
              const url = getAvatarUrl(c.avatarPath);
              return url ? (
                <img
                  src={url}
                  alt={c.fullName}
                  className="h-14 w-14 rounded-sm object-cover border border-gold/30 flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="h-14 w-14 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-base text-gold">
                    {initials(c.fullName)}
                  </span>
                </div>
              );
            })()}
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-lg leading-tight truncate">
                {c.fullName || "Unnamed"}
              </h4>
              {c.headline && (
                <p className="text-xs text-muted-foreground truncate">
                  {c.headline}
                </p>
              )}
              {c.location && (
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1">
                  {c.location}
                </p>
              )}
              {c.linkedinUrl && (
                <a
                  href={c.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-gold hover:underline mt-2"
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnsave(c.userId)}
              aria-label={`Remove ${c.fullName || "candidate"}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};
