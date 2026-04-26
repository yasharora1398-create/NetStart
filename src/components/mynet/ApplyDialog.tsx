import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createApplication, getAvatarUrl } from "@/lib/mynet-storage";
import type { PublicProject } from "@/lib/mynet-types";

const initials = (name: string): string => {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

type ApplyDialogProps = {
  project: PublicProject | null;
  onClose: () => void;
  onApplied: (projectId: string) => void;
};

export const ApplyDialog = ({ project, onClose, onApplied }: ApplyDialogProps) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!project) return;
    if (message.trim().length < 10) {
      toast.error("Pitch yourself in at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await createApplication(project.id, message.trim());
      toast.success("Application sent.");
      onApplied(project.id);
      onClose();
      setMessage("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not send application.";
      toast.error(
        msg.includes("duplicate") || msg.includes("unique")
          ? "You've already applied to this project."
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={Boolean(project)}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setMessage("");
        }
      }}
    >
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {project?.title}</DialogTitle>
          <DialogDescription>
            One short pitch. Why you, why this project. The founder sees this with
            your candidate profile.
          </DialogDescription>
        </DialogHeader>
        {project && (project.founderFullName || project.founderHeadline) && (
          <div className="rounded-sm border border-border bg-background/40 p-3 flex items-center gap-3">
            {(() => {
              const url = getAvatarUrl(project.founderAvatarPath);
              return url ? (
                <img
                  src={url}
                  alt={project.founderFullName}
                  className="h-10 w-10 rounded-sm object-cover border border-gold/30 flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-xs text-gold">
                    {initials(project.founderFullName)}
                  </span>
                </div>
              );
            })()}
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Founder
              </p>
              <p className="text-sm truncate">
                {project.founderFullName || "Anonymous"}
                {project.founderHeadline && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {project.founderHeadline}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I shipped X, I want to focus on Y, here's why I'm a fit..."
          rows={6}
          className="bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
