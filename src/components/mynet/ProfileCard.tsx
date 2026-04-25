import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Linkedin,
  Loader2,
  Send,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile, ReviewStatus } from "@/lib/mynet-types";

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isValidLinkedIn = (url: string): boolean => {
  if (!url.trim()) return true;
  try {
    const u = new URL(url);
    return u.hostname.endsWith("linkedin.com");
  } catch {
    return false;
  }
};

export type ProfileSubmission = {
  linkedin?: string;
  file?: File;
  removeResume?: boolean;
};

type ProfileCardProps = {
  profile: Profile;
  onSubmit: (changes: ProfileSubmission) => Promise<void>;
};

export const ProfileCard = ({ profile, onSubmit }: ProfileCardProps) => {
  const [linkedin, setLinkedin] = useState(profile.linkedinUrl);
  const [linkedinDirty, setLinkedinDirty] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!linkedinDirty) setLinkedin(profile.linkedinUrl);
  }, [profile.linkedinUrl, linkedinDirty]);

  const linkedinChanged = linkedin.trim() !== profile.linkedinUrl.trim();
  const resumeChanged = pendingFile !== null || removeRequested;
  const hasChanges = linkedinChanged || resumeChanged;
  const isDraftLike =
    profile.reviewStatus === "draft" || profile.reviewStatus === "rejected";
  const canSubmit = hasChanges || isDraftLike;

  const submitLabel =
    profile.reviewStatus === "draft"
      ? "Submit for review"
      : profile.reviewStatus === "rejected"
        ? "Resubmit for review"
        : hasChanges
          ? "Update submission"
          : "Submitted";

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_RESUME_BYTES) {
      toast.error(`File too large. Max ${formatBytes(MAX_RESUME_BYTES)}.`);
      return;
    }
    setPendingFile(file);
    setRemoveRequested(false);
  };

  const handleClearResume = () => {
    if (pendingFile) {
      setPendingFile(null);
    } else if (profile.resume) {
      setRemoveRequested(true);
    }
  };

  const handleUndoRemove = () => setRemoveRequested(false);

  const handleSubmit = async () => {
    if (!isValidLinkedIn(linkedin)) {
      toast.error("Enter a valid LinkedIn URL.");
      return;
    }
    setSubmitting(true);
    try {
      const changes: ProfileSubmission = {};
      if (linkedinChanged) changes.linkedin = linkedin.trim();
      if (pendingFile) changes.file = pendingFile;
      else if (removeRequested) changes.removeResume = true;

      await onSubmit(changes);

      setPendingFile(null);
      setRemoveRequested(false);
      setLinkedinDirty(false);
    } catch {
      // parent already toasts; keep local state for retry
    } finally {
      setSubmitting(false);
    }
  };

  const displayResume = pendingFile
    ? { name: pendingFile.name, size: pendingFile.size, isPending: true }
    : profile.resume && !removeRequested
      ? {
          name: profile.resume.name,
          size: profile.resume.size,
          isPending: false,
        }
      : null;

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
              Your profile
            </p>
            <h2 className="font-display text-2xl md:text-3xl">Credentials</h2>
          </div>
          <StatusPill status={profile.reviewStatus} />
        </div>

        {profile.reviewStatus === "rejected" && profile.reviewReason && (
          <div className="rounded-sm border border-destructive/40 bg-destructive/5 p-4 mb-6">
            <p className="text-[11px] font-mono uppercase tracking-widest text-destructive mb-1">
              Reviewer note
            </p>
            <p className="text-sm leading-relaxed">{profile.reviewReason}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* LinkedIn */}
          <div>
            <Label
              htmlFor="linkedin"
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
            >
              <Linkedin className="h-3.5 w-3.5 text-gold" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => {
                setLinkedin(e.target.value);
                setLinkedinDirty(true);
              }}
              placeholder="https://linkedin.com/in/your-handle"
              className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
            />
            {linkedinChanged ? (
              <p className="text-[11px] font-mono uppercase tracking-widest text-gold mt-2">
                Unsaved change
              </p>
            ) : profile.linkedinUrl ? (
              <p className="text-[11px] text-muted-foreground mt-2">
                Saved · <span className="text-foreground/80">{profile.linkedinUrl}</span>
              </p>
            ) : null}
          </div>

          {/* Resume */}
          <div>
            <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
              <FileText className="h-3.5 w-3.5 text-gold" />
              Resume
            </Label>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              onChange={onFileChange}
              className="sr-only"
              aria-label="Upload resume"
            />

            {displayResume ? (
              <div
                className={`rounded-sm border bg-background p-3 flex items-center gap-3 ${
                  displayResume.isPending ? "border-gold/50" : "border-border"
                }`}
              >
                <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{displayResume.name}</p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    {formatBytes(displayResume.size)}
                    {displayResume.isPending && (
                      <span className="text-gold normal-case tracking-normal">
                        {" "}
                        · Ready to submit
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearResume}
                  aria-label="Remove resume"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outlineGold"
                size="lg"
                onClick={() => fileRef.current?.click()}
                className="w-full h-11"
              >
                <Upload className="h-4 w-4" />
                Upload resume
              </Button>
            )}

            {removeRequested && !pendingFile && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-mono uppercase tracking-widest text-destructive">
                  Will be removed on submit
                </p>
                <button
                  type="button"
                  onClick={handleUndoRemove}
                  className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  Undo
                </button>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground mt-2">
              PDF or DOC, max 4 MB.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {hasChanges
              ? "Click submit to send for review"
              : profile.reviewStatus === "draft"
                ? "Add your details, then submit"
                : "Your submission is up to date"}
          </p>
          <Button
            variant="gold"
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

const StatusPill = ({ status }: { status: ReviewStatus }) => {
  const config = {
    draft: {
      label: "Draft",
      className: "border-border bg-background text-muted-foreground",
      Icon: Clock,
    },
    pending: {
      label: "Under review",
      className: "border-gold/40 bg-gold/10 text-gold",
      Icon: Clock,
    },
    accepted: {
      label: "Accepted",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      Icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      className: "border-destructive/40 bg-destructive/10 text-destructive",
      Icon: XCircle,
    },
  }[status];
  const Icon = config.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-widest ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};
