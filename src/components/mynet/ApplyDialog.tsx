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
import { createApplication } from "@/lib/mynet-storage";
import type { PublicProject } from "@/lib/mynet-types";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to {project?.title}</DialogTitle>
          <DialogDescription>
            One short pitch. Why you, why this project. The founder sees this with
            your candidate profile.
          </DialogDescription>
        </DialogHeader>
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
