import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Briefcase,
  Camera,
  Loader2,
  MapPin,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/mynet/TagInput";
import { getAvatarUrl } from "@/lib/mynet-storage";
import type { CandidateProfile, Profile } from "@/lib/mynet-types";

const initials = (name: string): string => {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

type CandidateCardProps = {
  profile: Profile;
  onSave: (data: {
    candidate: CandidateProfile;
    fullName: string;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
};

export const CandidateCard = ({
  profile,
  onSave,
  onUploadAvatar,
  onRemoveAvatar,
}: CandidateCardProps) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [headline, setHeadline] = useState(profile.candidate.headline);
  const [bio, setBio] = useState(profile.candidate.bio);
  const [skills, setSkills] = useState<string[]>(profile.candidate.skills);
  const [location, setLocation] = useState(profile.candidate.location);
  const [commitment, setCommitment] = useState(profile.candidate.commitment);
  const [open, setOpen] = useState(profile.candidate.isOpenToWork);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement | null>(null);
  const avatarUrl = getAvatarUrl(profile.avatarPath);

  useEffect(() => {
    if (dirty) return;
    setFullName(profile.fullName);
    setHeadline(profile.candidate.headline);
    setBio(profile.candidate.bio);
    setSkills(profile.candidate.skills);
    setLocation(profile.candidate.location);
    setCommitment(profile.candidate.commitment);
    setOpen(profile.candidate.isOpenToWork);
  }, [profile, dirty]);

  const isAccepted = profile.reviewStatus === "accepted";
  const arraysEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  const hasChanges =
    dirty &&
    (fullName !== profile.fullName ||
      headline !== profile.candidate.headline ||
      bio !== profile.candidate.bio ||
      !arraysEqual(skills, profile.candidate.skills) ||
      location !== profile.candidate.location ||
      commitment !== profile.candidate.commitment ||
      open !== profile.candidate.isOpenToWork);

  const markDirty = () => {
    if (!dirty) setDirty(true);
  };

  const handleToggleOpen = async (next: boolean) => {
    if (!isAccepted) {
      toast.error("Get accepted before going live as a candidate.");
      return;
    }
    setOpen(next);
    setDirty(true);
  };

  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file.");
      return;
    }
    setUploadingAvatar(true);
    try {
      await onUploadAvatar(file);
      toast.success("Photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await onRemoveAvatar();
      toast.success("Photo removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        candidate: {
          headline: headline.trim(),
          bio: bio.trim(),
          skills,
          location: location.trim(),
          commitment: commitment.trim(),
          isOpenToWork: open && isAccepted,
        },
        fullName: fullName.trim(),
      });
      setDirty(false);
      toast.success("Candidate profile saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
              For founders
            </p>
            <h2 className="font-display text-2xl md:text-3xl">
              How operators find you
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
              Toggle on to be discoverable. Founders running Find People will see
              your headline, skills, and LinkedIn.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-[11px] font-mono uppercase tracking-widest ${
                open ? "text-gold" : "text-muted-foreground"
              }`}
            >
              {open ? "Open to work" : "Closed"}
            </span>
            <Switch
              checked={open}
              onCheckedChange={handleToggleOpen}
              disabled={!isAccepted}
              aria-label="Open to work"
            />
          </div>
        </div>

        {!isAccepted && (
          <div className="rounded-sm border border-border bg-background/40 p-4 mb-6">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Locked
            </p>
            <p className="text-sm">
              Your credentials need to be accepted before you can be discovered.
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            className="sr-only"
            aria-label="Upload photo"
          />
          <div className="relative h-20 w-20 flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || "Avatar"}
                className="h-20 w-20 rounded-sm object-cover border border-gold/30"
              />
            ) : (
              <div className="h-20 w-20 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center">
                <span className="font-display text-2xl text-gold">
                  {initials(fullName)}
                </span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-sm">
                <Loader2 className="h-4 w-4 text-gold animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outlineGold"
              size="sm"
              onClick={() => avatarRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <Camera className="h-4 w-4" />
              {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            {avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label
              htmlFor="full-name"
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
            >
              <User className="h-3.5 w-3.5 text-gold" />
              Full name
            </Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                markDirty();
              }}
              placeholder="Marcus Vey"
              className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
            />
          </div>
          <div>
            <Label
              htmlFor="headline"
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
            >
              <UserCheck className="h-3.5 w-3.5 text-gold" />
              Headline
            </Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                markDirty();
              }}
              placeholder="Senior backend engineer, ex-Stripe"
              className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
            />
          </div>
        </div>

        <div className="mb-6">
          <Label
            htmlFor="bio"
            className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block"
          >
            Pitch
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              markDirty();
            }}
            rows={4}
            placeholder="What you've shipped. Where you want to focus next. Why a founder should reach out."
            className="bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label
              htmlFor="commitment"
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
            >
              <Briefcase className="h-3.5 w-3.5 text-gold" />
              Commitment
            </Label>
            <Input
              id="commitment"
              value={commitment}
              onChange={(e) => {
                setCommitment(e.target.value);
                markDirty();
              }}
              placeholder="Full-time, advisor, contract..."
              className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
            />
          </div>
          <div>
            <Label
              htmlFor="location"
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
            >
              <MapPin className="h-3.5 w-3.5 text-gold" />
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                markDirty();
              }}
              placeholder="NYC, remote..."
              className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
            />
          </div>
        </div>

        <div className="mb-8">
          <Label
            htmlFor="skills"
            className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block"
          >
            Skills
          </Label>
          <TagInput
            id="skills"
            value={skills}
            onChange={(next) => {
              setSkills(next);
              markDirty();
            }}
            placeholder="React, Solidity, Go..."
          />
        </div>

        <div className="border-t border-border pt-6 flex items-center justify-end">
          <Button
            variant="gold"
            size="lg"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save candidate profile
          </Button>
        </div>
      </div>
    </div>
  );
};
