import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Linkedin, FileText, Upload, Trash2, Save, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/mynet-types";

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

type ProfileCardProps = {
  profile: Profile;
  onSaveLinkedIn: (url: string) => Promise<void> | void;
  onUploadResume: (file: File) => Promise<void> | void;
  onRemoveResume: () => Promise<void> | void;
};

export const ProfileCard = ({
  profile,
  onSaveLinkedIn,
  onUploadResume,
  onRemoveResume,
}: ProfileCardProps) => {
  const [linkedin, setLinkedin] = useState(profile.linkedinUrl);
  const [linkedinDirty, setLinkedinDirty] = useState(false);
  const [savingLinkedIn, setSavingLinkedIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!linkedinDirty) setLinkedin(profile.linkedinUrl);
  }, [profile.linkedinUrl, linkedinDirty]);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_RESUME_BYTES) {
      toast.error(`File too large. Max ${formatBytes(MAX_RESUME_BYTES)}.`);
      return;
    }

    setUploading(true);
    try {
      await onUploadResume(file);
      toast.success("Resume uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveLinkedIn = async () => {
    if (!isValidLinkedIn(linkedin)) {
      toast.error("Enter a valid LinkedIn URL.");
      return;
    }
    setSavingLinkedIn(true);
    try {
      await onSaveLinkedIn(linkedin.trim());
      setLinkedinDirty(false);
      toast.success("LinkedIn saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingLinkedIn(false);
    }
  };

  const handleRemove = async () => {
    try {
      await onRemoveResume();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove resume.");
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
              Your profile
            </p>
            <h2 className="font-display text-2xl md:text-3xl">Credentials</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LinkedIn */}
          <div>
            <Label
              htmlFor="linkedin"
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
            >
              <Linkedin className="h-3.5 w-3.5 text-gold" />
              LinkedIn
            </Label>
            <div className="flex gap-2">
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
              <Button
                variant={linkedinDirty ? "gold" : "outlineGold"}
                size="sm"
                onClick={handleSaveLinkedIn}
                disabled={!linkedinDirty || savingLinkedIn}
                className="h-11 px-4 flex-shrink-0"
                aria-label="Save LinkedIn"
              >
                {savingLinkedIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : linkedinDirty ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
            {profile.linkedinUrl && !linkedinDirty && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Saved · <span className="text-foreground/80">{profile.linkedinUrl}</span>
              </p>
            )}
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

            {profile.resume ? (
              <div className="rounded-sm border border-border bg-background p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{profile.resume.name}</p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    {formatBytes(profile.resume.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  aria-label="Remove resume"
                  disabled={uploading}
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
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Upload resume"}
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">
              PDF or DOC, max 4 MB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
