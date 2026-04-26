import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Linkedin,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  getAvatarUrl,
  getCandidatesByIds,
  notifyCandidates,
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

type SavedPeopleListProps = {
  project: Project;
  onUnsave: (personId: string) => void;
};

export const SavedPeopleList = ({ project, onUnsave }: SavedPeopleListProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState("");
  const [sending, setSending] = useState(false);

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

  // Drop selected IDs that no longer exist in the candidate list
  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(candidates.map((c) => c.userId));
      const next = new Set<string>();
      for (const id of prev) if (valid.has(id)) next.add(id);
      return next;
    });
  }, [candidates]);

  const allSelected = useMemo(
    () => candidates.length > 0 && selected.size === candidates.length,
    [candidates, selected],
  );

  const toggleOne = (id: string, value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === candidates.length
        ? new Set()
        : new Set(candidates.map((c) => c.userId)),
    );
  };

  const openDialog = () => {
    if (selected.size === 0) return;
    setOutreachMessage("");
    setDialogOpen(true);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const count = await notifyCandidates(
        project.id,
        Array.from(selected),
        outreachMessage.trim() || null,
      );
      toast.success(
        count === 1
          ? "1 candidate notified."
          : `${count} candidates notified.`,
      );
      setSelected(new Set());
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not notify.");
    } finally {
      setSending(false);
    }
  };

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
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <Checkbox checked={allSelected} aria-label="Select all" />
          {allSelected ? "Clear all" : "Select all"}
          <span className="text-muted-foreground/70">
            ({selected.size}/{candidates.length})
          </span>
        </button>
        <Button
          variant="gold"
          size="sm"
          onClick={openDialog}
          disabled={selected.size === 0}
        >
          <Send className="h-4 w-4" />
          Notify &amp; connect
          {selected.size > 0 && (
            <span className="ml-1 text-[11px] font-mono">({selected.size})</span>
          )}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {candidates.map((c) => {
          const isChecked = selected.has(c.userId);
          const avatarUrl = getAvatarUrl(c.avatarPath);
          return (
            <article
              key={c.userId}
              className={`rounded-sm border bg-card hover:border-gold/40 transition-colors overflow-hidden ${
                isChecked ? "border-gold/60 ring-1 ring-gold/30" : "border-border"
              }`}
            >
              <div className="flex gap-3 p-4">
                <div className="pt-1 flex-shrink-0">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(v) => toggleOne(c.userId, Boolean(v))}
                    aria-label={`Select ${c.fullName || "candidate"}`}
                  />
                </div>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
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
                )}
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
          );
        })}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDialogOpen(false);
            setOutreachMessage("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Notify {selected.size}{" "}
              {selected.size === 1 ? "candidate" : "candidates"}
            </DialogTitle>
            <DialogDescription>
              They'll get a notification telling them you want to connect about
              {" "}
              <span className="text-foreground">{project.title}</span>. Your
              LinkedIn is included so they can reply.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={outreachMessage}
            onChange={(e) => setOutreachMessage(e.target.value)}
            placeholder="Optional note. What you want to chat about, what you're impressed by, time you have..."
            rows={5}
            className="bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDialogOpen(false);
                setOutreachMessage("");
              }}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
