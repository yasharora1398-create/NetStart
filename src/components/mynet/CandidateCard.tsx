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

import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/mynet/TagInput";
import { getAvatarUrl } from "@/lib/mynet-storage";
import {
 COMMITMENT_OPTIONS,
 HEADLINE_OPTIONS,
 LOCATION_OPTIONS,
 PARTNER_ROLE_OPTIONS,
 SKILLS_OPTIONS,
} from "@/lib/options";
import {
 CANDIDATE_BIO_MIN,
 CANDIDATE_SKILLS_MIN,
 candidateGaps,
 isCandidateProfileComplete,
 type CandidateProfile,
 type PartnerRole,
 type Profile,
} from "@/lib/mynet-types";

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
 // Optional-by-design location: toggle defaults ON only if a value
 // is already saved, otherwise OFF so existing users keep their
 // pick while new users can ship without one.
 const [locationEnabled, setLocationEnabled] = useState(() =>
 Boolean(profile.candidate.location.trim()),
 );
 const [commitment, setCommitment] = useState(profile.candidate.commitment);
 // C-level role (CTO / CPO / CMO / CRO / CDO / COO / CFO). Null
 // until the partner picks one. Founders never see this section
 // because they edit projects, not their candidate profile.
 const [partnerRole, setPartnerRole] = useState<PartnerRole | null>(
 profile.candidate.partnerRole,
 );
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
 setLocationEnabled(Boolean(profile.candidate.location.trim()));
 setCommitment(profile.candidate.commitment);
 setPartnerRole(profile.candidate.partnerRole);
 }, [profile, dirty]);

 const isAccepted = profile.reviewStatus === "accepted";
 const liveCandidate: CandidateProfile = {
 headline: headline.trim(),
 bio: bio.trim(),
 skills,
 location: location.trim(),
 commitment: commitment.trim(),
 isOpenToWork: profile.candidate.isOpenToWork,
 availability: profile.candidate.availability,
 partnerRole,
 };
 const profileComplete = isCandidateProfileComplete(liveCandidate);
 const missing = candidateGaps(liveCandidate);
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
 partnerRole !== profile.candidate.partnerRole);

 const markDirty = () => {
 if (!dirty) setDirty(true);
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
 isOpenToWork: profile.candidate.isOpenToWork && isAccepted,
 availability: profile.candidate.availability,
 partnerRole,
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
 <div className="mb-6">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
 For founders
 </p>
 <p className="text-sm text-muted-foreground max-w-lg">
 Founders running Find People will see your headline, skills, and
 LinkedIn. Use the switch at the top of this section to control
 whether you&apos;re discoverable.
 </p>
 </div>

 {!isAccepted ? (
 <div className="rounded-sm border border-border bg-background p-4 mb-6">
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
 Locked
 </p>
 <p className="text-sm">
 Your credentials need to be accepted before you can be discovered.
 </p>
 </div>
 ) : !profileComplete ? (
 <div className="rounded-sm border border-gold bg-gold p-4 mb-6">
 <p className="text-[11px] font-mono uppercase tracking-widest text-primary-foreground mb-1">
 Almost there
 </p>
 <p className="text-sm text-primary-foreground">
 Fill in <span className="font-semibold">{missing.join(", ")}</span>
 {" "}
 so founders see a strong profile when you go open.
 </p>
 </div>
 ) : null}

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
 className="h-20 w-20 rounded-sm object-cover border border-gold"
 />
 ) : (
 <div className="h-20 w-20 rounded-sm bg-muted border border-border flex items-center justify-center">
 <User className="h-10 w-10 text-muted-foreground" />
 </div>
 )}
 {uploadingAvatar && (
 <div className="absolute inset-0 bg-background flex items-center justify-center rounded-sm">
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
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
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
 <Autocomplete
 id="headline"
 value={headline}
 onChange={(v) => {
 setHeadline(v);
 markDirty();
 }}
 options={HEADLINE_OPTIONS}
 placeholder="Type or pick the role you fit best..."
 />
 </div>
 </div>

 <div className="mb-6">
 <Label
 htmlFor="bio"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between"
 >
 <span>Pitch / Bio</span>
 <span
 className={`font-normal normal-case tracking-normal text-[11px] ${
 bio.trim().length >= CANDIDATE_BIO_MIN
 ? "text-primary-foreground"
 : "text-muted-foreground"
 }`}
 >
 {bio.trim().length}/{CANDIDATE_BIO_MIN}
 </span>
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
 className="bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </div>

 {/* Partner-only C-level role picker. Renders for everyone
 in CandidateCard since this component is the partner-side
 profile editor; founders edit projects, never their
 candidate profile. */}
 <div className="mb-6">
 <Label
 htmlFor="partner-role"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
 >
 <UserCheck className="h-3.5 w-3.5 text-gold" />
 The role you want to play
 </Label>
 {/* value={undefined} when null so Radix shows the placeholder
 instead of a "No preference" label - we explicitly don't
 want users with no role set to see anything that implies a
 picked preference. Once a role is picked the user can change
 it but can't clear it back to null from this control;
 that's fine since the field is purely additive cosmetic. */}
 <Select
 value={partnerRole ?? undefined}
 onValueChange={(v) => {
 setPartnerRole(v as PartnerRole);
 markDirty();
 }}
 >
 <SelectTrigger id="partner-role">
 <SelectValue placeholder="Optional — pick a role" />
 </SelectTrigger>
 <SelectContent>
 {PARTNER_ROLE_OPTIONS.map((opt) => (
 <SelectItem key={opt.value} value={opt.value}>
 {opt.label} — {opt.description}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <p className="text-[11px] text-muted-foreground mt-1.5">
 Optional. Pick the C-suite seat you&apos;d step into on
 the next venture and it shows as a pill on your Match card.
 Leave blank to keep your card exactly as it is now.
 </p>
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
 <Autocomplete
 id="commitment"
 value={commitment}
 onChange={(v) => {
 setCommitment(v);
 markDirty();
 }}
 options={COMMITMENT_OPTIONS}
 placeholder="Type or pick how much you can give..."
 />
 </div>
 <div>
 <div className="flex items-center justify-between mb-2 gap-3">
 <Label
 htmlFor="location"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2"
 >
 <MapPin className="h-3.5 w-3.5 text-gold" />
 Location
 </Label>
 <div className="flex items-center gap-2">
 <span
 className={`text-[11px] font-mono uppercase tracking-[0.18em] ${
 locationEnabled ? "text-gold" : "text-muted-foreground"
 }`}
 >
 {locationEnabled ? "On" : "Off"}
 </span>
 <Switch
 checked={locationEnabled}
 onCheckedChange={(next) => {
 setLocationEnabled(next);
 if (!next) {
 setLocation("");
 markDirty();
 }
 }}
 aria-label="Toggle location field"
 />
 </div>
 </div>
 {locationEnabled ? (
 <Autocomplete
 id="location"
 value={location}
 onChange={(v) => {
 setLocation(v);
 markDirty();
 }}
 options={LOCATION_OPTIONS}
 placeholder="Pick a country..."
 />
 ) : (
 <div className="h-11 rounded-sm border border-dashed border-border bg-background px-3 flex items-center text-[12px] text-muted-foreground">
 Location off - turn on to pick a country.
 </div>
 )}
 <p className="text-[11px] text-muted-foreground mt-2">
 Adding a location is beneficial but not required.
 </p>
 </div>
 </div>

 <div className="mb-8">
 <Label
 htmlFor="skills"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between"
 >
 <span>Skills</span>
 <span
 className={`font-normal normal-case tracking-normal text-[11px] ${
 skills.length >= CANDIDATE_SKILLS_MIN
 ? "text-primary-foreground"
 : "text-muted-foreground"
 }`}
 >
 {skills.length}/{CANDIDATE_SKILLS_MIN} min
 </span>
 </Label>
 <TagInput
 id="skills"
 value={skills}
 onChange={(next) => {
 setSkills(next);
 markDirty();
 }}
 options={SKILLS_OPTIONS}
 placeholder="Type to filter, click to add..."
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
