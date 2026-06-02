import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
 ArrowLeft,
 ArrowRight,
 Camera,
 Check,
 FileText,
 Hammer,
 Linkedin,
 Loader2,
 MapPin,
 Send,
 Telescope,
 Trash2,
 Upload,
 UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Autocomplete } from "@/components/ui/autocomplete";
import { TagInput } from "@/components/mynet/TagInput";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

import {
 createProject,
 getAvatarUrl,
 getProofPath,
 getResumePath,
 removeProof,
 removeResume,
 setLinkedIn,
 setWebsite,
 submitProfile,
 updateCandidate,
 uploadAvatar,
 uploadProof,
 uploadResume,
} from "@/lib/mynet-storage";
import {
 CANDIDATE_BIO_MIN,
 CANDIDATE_SKILLS_MIN,
 type Profile,
} from "@/lib/mynet-types";
import {
 BUSINESS_TYPE_OPTIONS,
 COMMITMENT_OPTIONS,
 HEADLINE_OPTIONS,
 LOCATION_OPTIONS,
 SKILLS_OPTIONS,
} from "@/lib/options";

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

const STEP_LABELS = ["Credentials", "Mode", "Details"] as const;

type Stage = "intro" | "credentials" | "mode" | "looking" | "building";

type Props = {
 uid: string;
 profile: Profile;
 onProfileRefresh: () => void | Promise<void>;
 onSubmitComplete?: () => void;
 /**
 * Pre-picked role from sign-up. When supplied, the wizard skips
 * the mode-pick step and goes straight to "looking" or "building"
 * after credentials. Comes from `user_metadata.role`.
 */
 preselectedRole?: "founder" | "partner";
 /**
 * Notified whenever the wizard advances or moves back through
 * its internal stage machine. Used by the setup modal to render
 * a "Step X of N" progress indicator above the slide.
 */
 onStageChange?: (info: {
 current: number;
 total: number;
 label: string;
 }) => void;
};

const isValidLinkedIn = (url: string): boolean => {
 if (!url.trim()) return true;
 try {
 return new URL(url).hostname.endsWith("linkedin.com");
 } catch {
 return false;
 }
};

const formatBytes = (bytes: number): string => {
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const errMsg = (e: unknown): string =>
 e instanceof Error ? e.message : "Something went wrong.";

export const MyNetWizard = ({
 uid,
 profile,
 onProfileRefresh,
 onSubmitComplete,
 preselectedRole,
 onStageChange,
}: Props) => {
 // Rejected users start at credentials so they can update and resubmit.
 const [stage, setStage] = useState<Stage>(
 profile.reviewStatus === "rejected" ? "credentials" : "intro",
 );

 // Emit a progress payload to the host whenever stage changes.
 // The total is 4 normally (intro/credentials/mode/details) or 3
 // when preselectedRole skips the mode step.
 useEffect(() => {
 if (!onStageChange) return;
 const skipsMode = Boolean(preselectedRole);
 const total = skipsMode ? 3 : 4;
 const orderedStages: ReadonlyArray<{
 stage: Stage | "details";
 label: string;
 }> = skipsMode
 ? [
 { stage: "intro", label: "Intro" },
 { stage: "credentials", label: "Credentials" },
 { stage: "details", label: "Details" },
 ]
 : [
 { stage: "intro", label: "Intro" },
 { stage: "credentials", label: "Credentials" },
 { stage: "mode", label: "Mode" },
 { stage: "details", label: "Details" },
 ];
 const idx = orderedStages.findIndex((s) =>
 s.stage === "details"
 ? stage === "looking" || stage === "building"
 : s.stage === stage,
 );
 if (idx < 0) return;
 onStageChange({
 current: idx + 1,
 total,
 label: orderedStages[idx].label,
 });
 }, [stage, preselectedRole, onStageChange]);

 // Step 1 - credentials
 const [linkedin, setLinkedin] = useState(profile.linkedinUrl);
 const [pendingResume, setPendingResume] = useState<File | null>(null);
 const fileRef = useRef<HTMLInputElement>(null);

 // Step 1 - founder-only credential extras (website + proof file)
 const [website, setWebsiteValue] = useState(profile.websiteUrl ?? "");
 const [pendingProof, setPendingProof] = useState<File | null>(null);
 const proofRef = useRef<HTMLInputElement>(null);

 // Step 3 - profile picture (required, both modes)
 const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
 const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
 const avatarRef = useRef<HTMLInputElement>(null);
 const existingAvatarUrl = getAvatarUrl(profile.avatarPath);

 // Step 3 - looking
 const [fullName, setFullName] = useState(profile.fullName);
 const [headline, setHeadline] = useState(profile.candidate.headline);
 const [bio, setBio] = useState(profile.candidate.bio);
 const [lookingSkills, setLookingSkills] = useState<string[]>(
 profile.candidate.skills,
 );
 const [lookingLocation, setLookingLocation] = useState(
 profile.candidate.location,
 );
 // Location is optional - default the toggle ON only if the user
 // already has a saved location, otherwise OFF so the wizard reads
 // as "not required" out of the box.
 const [lookingLocationEnabled, setLookingLocationEnabled] = useState(
 () => Boolean(profile.candidate.location.trim()),
 );
 const [lookingCommitment, setLookingCommitment] = useState(
 profile.candidate.commitment,
 );

 // Step 3 - building
 const [projectTitle, setProjectTitle] = useState("");
 const [projectBusinessType, setProjectBusinessType] = useState("");
 const [projectDesc, setProjectDesc] = useState("");
 const [projectSkills, setProjectSkills] = useState<string[]>([]);
 const [projectCommitment, setProjectCommitment] = useState("");
 const [projectLocation, setProjectLocation] = useState("");
 // Same opt-in toggle as the candidate side: defaults ON only if
 // a project location was already set.
 const [projectLocationEnabled, setProjectLocationEnabled] = useState(false);
 const [projectKeywords, setProjectKeywords] = useState("");

 const [working, setWorking] = useState(false);

 const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 if (file.size > MAX_RESUME_BYTES) {
 toast.error(`File too large. Max ${formatBytes(MAX_RESUME_BYTES)}.`);
 return;
 }
 setPendingResume(file);
 };

 const onProofChange = (e: ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 if (file.size > MAX_RESUME_BYTES) {
 toast.error(`File too large. Max ${formatBytes(MAX_RESUME_BYTES)}.`);
 return;
 }
 setPendingProof(file);
 };

 const handleRemoveExistingProof = async () => {
 if (!profile.proof) return;
 try {
 const path = await getProofPath(uid);
 await removeProof(uid, path);
 await onProfileRefresh();
 toast.success("Proof removed.");
 } catch (err) {
 toast.error(errMsg(err));
 }
 };

 const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 if (file.size > MAX_RESUME_BYTES) {
 toast.error(`Image too large. Max ${formatBytes(MAX_RESUME_BYTES)}.`);
 return;
 }
 if (!file.type.startsWith("image/")) {
 toast.error("Pick an image file.");
 return;
 }
 setPendingAvatar(file);
 const reader = new FileReader();
 reader.onload = () => {
 if (typeof reader.result === "string") setAvatarPreview(reader.result);
 };
 reader.readAsDataURL(file);
 };

 const handleRemoveExistingResume = async () => {
 if (!profile.resume || working) return;
 setWorking(true);
 try {
 const previousPath = await getResumePath(uid);
 await removeResume(uid, previousPath);
 await onProfileRefresh();
 toast.success("Resume removed.");
 } catch (err) {
 toast.error(errMsg(err));
 } finally {
 setWorking(false);
 }
 };

 const credentialsValid = Boolean(
 (linkedin.trim() !== "" && isValidLinkedIn(linkedin)) ||
 pendingResume ||
 profile.resume,
 );

 const hasAvatar = Boolean(pendingAvatar || profile.avatarPath);

 // Location is intentionally optional - if the user disabled it,
 // skip the non-empty check so submit isn't blocked.
 const lookingValid =
 fullName.trim() !== "" &&
 headline.trim() !== "" &&
 bio.trim().length >= CANDIDATE_BIO_MIN &&
 lookingSkills.length >= CANDIDATE_SKILLS_MIN &&
 (!lookingLocationEnabled || lookingLocation.trim() !== "") &&
 lookingCommitment.trim() !== "" &&
 hasAvatar;

 const buildingValid =
 projectTitle.trim().length >= 2 &&
 projectDesc.trim() !== "" &&
 projectSkills.length >= 1 &&
 projectCommitment.trim() !== "" &&
 (!projectLocationEnabled || projectLocation.trim() !== "") &&
 hasAvatar;

 const goCredentials = async () => {
 if (linkedin.trim() && !isValidLinkedIn(linkedin)) {
 toast.error("Enter a valid LinkedIn URL.");
 return;
 }
 if (!credentialsValid) {
 toast.error("Add your LinkedIn or upload a resume to continue.");
 return;
 }
 setWorking(true);
 try {
 if (linkedin.trim() !== profile.linkedinUrl) {
 await setLinkedIn(uid, linkedin.trim());
 }
 if (pendingResume) {
 const previousPath = await getResumePath(uid);
 await uploadResume(uid, pendingResume, previousPath);
 setPendingResume(null);
 }
 // Founder-only fields. Website saves on every step submission
 // (cheap upsert); proof uploads only when a new file is queued.
 if (preselectedRole === "founder") {
 if (website.trim() !== profile.websiteUrl) {
 await setWebsite(uid, website);
 }
 if (pendingProof) {
 const previousPath = await getProofPath(uid);
 await uploadProof(uid, pendingProof, previousPath);
 setPendingProof(null);
 }
 }
 await onProfileRefresh();
 // If sign-up already captured the role, skip the mode pick
 // and go straight into the matching half-of-the-wizard.
 if (preselectedRole === "partner") {
 setStage("looking");
 } else if (preselectedRole === "founder") {
 setStage("building");
 } else {
 setStage("mode");
 }
 } catch (err) {
 toast.error(errMsg(err));
 } finally {
 setWorking(false);
 }
 };

 const submitLooking = async () => {
 if (!lookingValid) {
 toast.error("Fill the required boxes to continue.");
 return;
 }
 setWorking(true);
 try {
 if (pendingAvatar) {
 await uploadAvatar(uid, pendingAvatar, profile.avatarPath);
 setPendingAvatar(null);
 setAvatarPreview(null);
 }
 await updateCandidate(
 uid,
 {
 headline: headline.trim(),
 bio: bio.trim(),
 skills: lookingSkills,
 location: lookingLocation.trim(),
 commitment: lookingCommitment.trim(),
 isOpenToWork: true,
 availability: profile.candidate.availability,
 partnerRole: profile.candidate.partnerRole,
 },
 fullName.trim(),
 );
 await submitProfile();
 await onProfileRefresh();
 toast.success("Submitted for review.");
 onSubmitComplete?.();
 } catch (err) {
 toast.error(errMsg(err));
 } finally {
 setWorking(false);
 }
 };

 const submitBuilding = async () => {
 if (!buildingValid) {
 toast.error("Fill the required boxes to continue.");
 return;
 }
 setWorking(true);
 try {
 if (pendingAvatar) {
 await uploadAvatar(uid, pendingAvatar, profile.avatarPath);
 setPendingAvatar(null);
 setAvatarPreview(null);
 }
 await createProject(uid, {
 title: projectTitle.trim(),
 description: projectDesc.trim(),
 criteria: {
 skills: projectSkills,
 commitment: projectCommitment,
 location: projectLocation,
 keywords: projectKeywords.trim(),
 },
 businessType: projectBusinessType.trim(),
 });
 await submitProfile();
 await onProfileRefresh();
 toast.success("Submitted for review.");
 onSubmitComplete?.();
 } catch (err) {
 toast.error(errMsg(err));
 } finally {
 setWorking(false);
 }
 };

 const activeStep = (() => {
 if (stage === "credentials") return 0;
 if (stage === "mode") return 1;
 if (stage === "looking" || stage === "building") return 2;
 return -1;
 })();

 return (
 <div className="container py-12 md:py-16">
 {stage !== "intro" && <Stepper active={activeStep} />}

 {stage === "intro" && (
 <Intro
 rejected={profile.reviewStatus === "rejected"}
 rejectionReason={profile.reviewReason}
 onStart={() => setStage("credentials")}
 />
 )}

 {stage === "credentials" && (
 <StepShell
 eyebrow="Step 01 of 03"
 title="Drop your credentials."
 subtitle={
 preselectedRole === "founder"
 ? "LinkedIn helps partners verify you when they consider applying."
 : "LinkedIn or a resume helps us verify you. We strongly recommend both, but either one will do."
 }
 >
 <div className="grid md:grid-cols-2 gap-6 mb-10">
 <Field
 label="LinkedIn"
 hint="Optional but strongly recommended"
 icon={<Linkedin className="h-3.5 w-3.5 text-gold" />}
 >
 <Input
 type="url"
 value={linkedin}
 onChange={(e) => setLinkedin(e.target.value)}
 placeholder="https://linkedin.com/in/your-handle"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </Field>

 {/* Resume only matters for partners. Founders pitch via
 their project page, not via a resume upload. */}
 {preselectedRole !== "founder" ? (
 <Field
 label="Resume"
 hint="PDF or DOC, max 4 MB"
 icon={<FileText className="h-3.5 w-3.5 text-gold" />}
 >
 <input
 ref={fileRef}
 type="file"
 accept=".pdf,.doc,.docx,application/pdf"
 onChange={onFileChange}
 className="sr-only"
 />
 {pendingResume ? (
 <ResumeRow
 name={pendingResume.name}
 size={formatBytes(pendingResume.size)}
 pending
 onReplace={() => fileRef.current?.click()}
 onClear={() => setPendingResume(null)}
 />
 ) : profile.resume ? (
 <ResumeRow
 name={profile.resume.name}
 size={formatBytes(profile.resume.size)}
 onReplace={() => fileRef.current?.click()}
 onClear={handleRemoveExistingResume}
 />
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
 </Field>
 ) : (
 <>
 {/* Founder-only: website link to whatever they're
 building, plus a proof file (deck, demo video,
 screenshots, anything that shows the project is
 real). Both optional but strongly hinted at. */}
 <Field
 label="What you're building"
 hint="Optional. Public site, landing page, or repo."
 >
 <Input
 type="url"
 value={website}
 onChange={(e) => setWebsiteValue(e.target.value)}
 placeholder="https://your-startup.com"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </Field>

 <Field
 label="Proof of work"
 hint="Deck, demo video, screenshots. PDF, image, or doc."
 icon={<FileText className="h-3.5 w-3.5 text-gold" />}
 >
 <input
 ref={proofRef}
 type="file"
 accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp4,application/pdf,image/*"
 onChange={onProofChange}
 className="sr-only"
 />
 {pendingProof ? (
 <ResumeRow
 name={pendingProof.name}
 size={formatBytes(pendingProof.size)}
 pending
 onReplace={() => proofRef.current?.click()}
 onClear={() => setPendingProof(null)}
 />
 ) : profile.proof ? (
 <ResumeRow
 name={profile.proof.name}
 size={formatBytes(profile.proof.size)}
 onReplace={() => proofRef.current?.click()}
 onClear={handleRemoveExistingProof}
 />
 ) : (
 <Button
 variant="outlineGold"
 size="lg"
 onClick={() => proofRef.current?.click()}
 className="w-full h-11"
 >
 <Upload className="h-4 w-4" />
 Upload proof
 </Button>
 )}
 </Field>
 </>
 )}
 </div>

 <Footer
 valid={credentialsValid}
 onNext={goCredentials}
 onBack={() => setStage("intro")}
 working={working}
 label="Continue"
 />
 </StepShell>
 )}

 {stage === "mode" && (
 <StepShell
 eyebrow="Step 02 of 03"
 title="What brings you here?"
 subtitle="Pick the path that fits today. You can always do both later."
 onBack={() => setStage("credentials")}
 >
 <div className="grid md:grid-cols-2 gap-5 md:gap-6">
 <ModeCard
 icon={<Hammer className="h-6 w-6" />}
 tag="I'm a founder"
 title="I have a project."
 body="You're building a venture and you need a partner, partner, or co-founder next to you. We'll set up the project."
 onClick={() => setStage("building")}
 />
 <ModeCard
 icon={<Telescope className="h-6 w-6" />}
 tag="I'm a partner"
 title="I want to join one."
 body="You're open to joining a project that fits your skills, your time, and the kind of work you want to do. We'll set up your candidate profile."
 onClick={() => setStage("looking")}
 />
 </div>
 </StepShell>
 )}

 {stage === "looking" && (
 <StepShell
 eyebrow="Step 03 of 03"
 title="Tell us about you."
 subtitle="A short pitch and a few specifics so founders can match with you."
 onBack={() => setStage("mode")}
 >
 <div className="space-y-6 mb-10">
 <AvatarField
 required
 previewUrl={avatarPreview ?? existingAvatarUrl}
 hasFile={Boolean(pendingAvatar || profile.avatarPath)}
 onPick={() => avatarRef.current?.click()}
 fileRef={avatarRef}
 onChange={onAvatarChange}
 />

 <div className="grid md:grid-cols-2 gap-6">
 <Field label="Full name" required>
 <Input
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 placeholder="Marcus Vey"
 className="h-11 bg-background border-border focus-visible:border-gold"
 />
 </Field>
 <Field label="Best fit headline" required>
 <Autocomplete
 value={headline}
 onChange={setHeadline}
 options={HEADLINE_OPTIONS}
 placeholder="Type or pick the role you fit best..."
 />
 </Field>
 </div>

 <Field
 label="Pitch / bio"
 required
 hint={`${bio.trim().length}/${CANDIDATE_BIO_MIN} chars minimum`}
 >
 <Textarea
 value={bio}
 onChange={(e) => setBio(e.target.value)}
 rows={4}
 placeholder="What you've shipped. Where you want to focus next. Why a founder should reach out."
 className="bg-background border-border focus-visible:border-gold"
 />
 </Field>

 <div className="grid md:grid-cols-2 gap-6">
 <Field label="Commitment" required>
 <Autocomplete
 value={lookingCommitment}
 onChange={setLookingCommitment}
 options={COMMITMENT_OPTIONS}
 placeholder="Type or pick how much you can give..."
 />
 </Field>
 <LocationField
 enabled={lookingLocationEnabled}
 onToggle={(next) => {
 setLookingLocationEnabled(next);
 if (!next) setLookingLocation("");
 }}
 value={lookingLocation}
 onChange={setLookingLocation}
 />
 </div>

 <Field
 label="Skills"
 required
 hint={`At least ${CANDIDATE_SKILLS_MIN} skills`}
 >
 <TagInput
 value={lookingSkills}
 onChange={setLookingSkills}
 options={SKILLS_OPTIONS}
 placeholder="Type to filter, click to add..."
 />
 </Field>
 </div>

 <Footer
 valid={lookingValid}
 onNext={submitLooking}
 onBack={() => setStage("mode")}
 working={working}
 label="Submit for review"
 icon={<Send className="h-4 w-4" />}
 />
 </StepShell>
 )}

 {stage === "building" && (
 <StepShell
 eyebrow="Step 03 of 03"
 title="Tell us what you're building."
 subtitle="Set up your project so the right partners can find it."
 onBack={() => setStage("mode")}
 >
 <div className="space-y-6 mb-10">
 <AvatarField
 required
 previewUrl={avatarPreview ?? existingAvatarUrl}
 hasFile={Boolean(pendingAvatar || profile.avatarPath)}
 onPick={() => avatarRef.current?.click()}
 fileRef={avatarRef}
 onChange={onAvatarChange}
 />

 <Field label="Project name" required>
 <Input
 value={projectTitle}
 onChange={(e) => setProjectTitle(e.target.value)}
 placeholder="e.g. Vertical AI for logistics"
 className="h-11 bg-background border-border focus-visible:border-gold"
 />
 </Field>

 <Field label="What you're building" required>
 <Textarea
 value={projectDesc}
 onChange={(e) => setProjectDesc(e.target.value)}
 rows={3}
 placeholder="One or two sentences. Stage, market, what's already shipped."
 className="bg-background border-border focus-visible:border-gold"
 />
 </Field>

 <div className="border-t border-border pt-6">
 <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold mb-1">
 Criteria
 </p>
 <p className="text-xs text-muted-foreground mb-5">
 Used by Find People to surface matches.
 </p>

 <Field
 label="Skills"
 required
 hint="At least one"
 >
 <TagInput
 value={projectSkills}
 onChange={setProjectSkills}
 options={SKILLS_OPTIONS}
 placeholder="Type to filter, click to add..."
 />
 </Field>

 <div className="grid md:grid-cols-2 gap-6 mt-5">
 <Field label="Commitment" required>
 <Autocomplete
 value={projectCommitment}
 onChange={setProjectCommitment}
 options={COMMITMENT_OPTIONS}
 placeholder="Type or pick what you need from them..."
 />
 </Field>
 <LocationField
 enabled={projectLocationEnabled}
 onToggle={(next) => {
 setProjectLocationEnabled(next);
 if (!next) setProjectLocation("");
 }}
 value={projectLocation}
 onChange={setProjectLocation}
 />
 </div>

 <div className="grid md:grid-cols-2 gap-6 mt-5">
 <Field
 label="Business type"
 hint="Optional. Helps partners filter."
 >
 <Autocomplete
 value={projectBusinessType}
 onChange={setProjectBusinessType}
 options={BUSINESS_TYPE_OPTIONS}
 placeholder="SaaS, Marketplace, Hardware..."
 />
 </Field>
 <Field label="Keywords" hint="Optional. Helps matching.">
 <Input
 value={projectKeywords}
 onChange={(e) => setProjectKeywords(e.target.value)}
 placeholder="e.g. payments, fintech, ex-Stripe"
 className="h-11 bg-background border-border focus-visible:border-gold"
 />
 </Field>
 </div>
 </div>
 </div>

 <Footer
 valid={buildingValid}
 onNext={submitBuilding}
 onBack={() => setStage("mode")}
 working={working}
 label="Submit for review"
 icon={<Send className="h-4 w-4" />}
 />
 </StepShell>
 )}
 </div>
 );
};

// ===== Sub-components =====

const Intro = ({
 onStart,
 rejected,
 rejectionReason,
}: {
 onStart: () => void;
 rejected: boolean;
 rejectionReason: string | null;
}) => {
 const steps = [
 {
 num: "01",
 title: "Credentials",
 body: "Drop your LinkedIn or upload a resume so we can verify you.",
 },
 {
 num: "02",
 title: "Mode",
 body: "Founder or partner - tell us which side of the network you're on.",
 },
 {
 num: "03",
 title: "Details",
 body: "Founders set up a project. Partners fill out a candidate profile.",
 },
 ];

 return (
 <div className="max-w-5xl mx-auto text-center animate-slide-in-right">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold bg-gold mb-6">
 <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-white">
 {rejected ? "Resubmit your profile" : "Welcome to MyNet"}
 </span>
 </div>

 <h1 className="font-display text-4xl sm:text-5xl md:text-7xl leading-[0.95] mb-6">
 This is <em className="text-gradient-gold not-italic">MyNet.</em>
 </h1>

 <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
 Your profile on Polln8. It&apos;s how every founder or partner on
 the network discovers you, decides if it&apos;s worth a chat, and
 trusts that you&apos;re real.
 </p>
 <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
 Every match starts here. Three short steps to get it built.
 </p>

 {rejected && rejectionReason && (
 <div className="max-w-xl mx-auto mb-10 rounded-sm border border-destructive bg-destructive p-5 text-left">
 <p className="text-[11px] font-mono uppercase tracking-widest text-destructive mb-2">
 Reviewer note
 </p>
 <p className="text-sm leading-relaxed">{rejectionReason}</p>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14 max-w-4xl mx-auto text-left">
 {steps.map((s) => (
 <div
 key={s.num}
 className="relative rounded-sm border border-border bg-card p-6 hover:border-gold transition-colors group"
 >
 <div className="font-mono text-3xl text-gold mb-3 tracking-[0.2em] group-hover:translate-x-0.5 transition-transform">
 {s.num}
 </div>
 <h3 className="font-display text-xl mb-2">{s.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">
 {s.body}
 </p>
 </div>
 ))}
 </div>

 <Button variant="gold" size="xl" onClick={onStart} className="group">
 {rejected ? "Update and resubmit" : "Next"}
 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
 </Button>
 </div>
 );
};

const Stepper = ({ active }: { active: number }) => (
 <div className="max-w-3xl mx-auto mb-12">
 <div className="flex items-center justify-between gap-3">
 {STEP_LABELS.map((label, i) => {
 const done = i < active;
 const current = i === active;
 return (
 <div key={label} className="flex-1 flex items-center gap-3">
 <div
 className={`flex items-center gap-2 ${
 current
 ? "text-gold"
 : done
 ? "text-foreground"
 : "text-muted-foreground"
 }`}
 >
 <div
 className={`flex h-7 w-7 items-center justify-center rounded-sm border text-[11px] font-mono ${
 current
 ? "border-gold bg-gold text-primary-foreground"
 : done
 ? "border-gold bg-gold"
 : "border-border bg-card"
 }`}
 >
 {done ? <Check className="h-3.5 w-3.5" /> : `0${i + 1}`}
 </div>
 <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-widest">
 {label}
 </span>
 </div>
 {i < STEP_LABELS.length - 1 && (
 <div
 className={`flex-1 h-px ${
 i < active ? "bg-gold" : "bg-border"
 }`}
 />
 )}
 </div>
 );
 })}
 </div>
 </div>
);

const StepShell = ({
 eyebrow,
 title,
 subtitle,
 onBack,
 children,
}: {
 eyebrow: string;
 title: string;
 subtitle: string;
 onBack?: () => void;
 children: React.ReactNode;
}) => (
 // animate-slide-in-right replaces the old fade-up so each
 // wizard stage transition reads as a horizontal slide when
 // rendered inside the setup modal. Outside the modal (legacy
 // full-page wizard), the animation still plays cleanly.
 <div className="max-w-3xl mx-auto animate-slide-in-right">
 {onBack && (
 <button
 onClick={onBack}
 className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
 >
 <ArrowLeft className="h-4 w-4" />
 <span className="font-mono uppercase tracking-widest text-xs">
 Back
 </span>
 </button>
 )}
 <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold mb-3">
 {eyebrow}
 </p>
 <h1 className="font-display text-3xl md:text-5xl leading-[1.05] mb-4">
 {title}
 </h1>
 <p className="text-muted-foreground max-w-xl mb-10">{subtitle}</p>
 {children}
 </div>
);

const Field = ({
 label,
 required,
 hint,
 icon,
 children,
}: {
 label: string;
 required?: boolean;
 hint?: string;
 icon?: React.ReactNode;
 children: React.ReactNode;
}) => (
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
 {icon}
 {label}
 {required && <span className="text-gold">*</span>}
 </Label>
 {children}
 {hint && (
 <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>
 )}
 </div>
);

// Optional-by-design Location field. Header label sits next to a
// toggle: ON shows the full country Autocomplete, OFF hides the
// picker entirely and the value is cleared. Submit validation
// skips the non-empty check when the toggle is OFF so the user
// can ship without picking a location.
const LocationField = ({
 enabled,
 onToggle,
 value,
 onChange,
}: {
 enabled: boolean;
 onToggle: (next: boolean) => void;
 value: string;
 onChange: (next: string) => void;
}) => (
 <div>
 <div className="flex items-center justify-between mb-2 gap-3">
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
 <MapPin className="h-3.5 w-3.5 text-gold" />
 Location
 </Label>
 <div className="flex items-center gap-2">
 <span
 className={`text-[11px] font-mono uppercase tracking-[0.18em] ${
 enabled ? "text-gold" : "text-muted-foreground"
 }`}
 >
 {enabled ? "On" : "Off"}
 </span>
 <Switch
 checked={enabled}
 onCheckedChange={onToggle}
 aria-label="Toggle location field"
 />
 </div>
 </div>
 {enabled ? (
 <Autocomplete
 value={value}
 onChange={onChange}
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
);

const AvatarField = ({
 required,
 previewUrl,
 hasFile,
 onPick,
 fileRef,
 onChange,
}: {
 required?: boolean;
 previewUrl: string | null;
 hasFile: boolean;
 onPick: () => void;
 fileRef: React.RefObject<HTMLInputElement>;
 onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => (
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
 <Camera className="h-3.5 w-3.5 text-gold" />
 Profile picture
 {required && <span className="text-gold">*</span>}
 </Label>
 <div className="flex items-center gap-4">
 <button
 type="button"
 onClick={onPick}
 aria-label="Upload profile picture"
 className="h-24 w-24 rounded-sm border-2 border-dashed border-border hover:border-gold transition-colors bg-background overflow-hidden flex items-center justify-center flex-shrink-0"
 >
 {previewUrl ? (
 <img
 src={previewUrl}
 alt="Profile preview"
 className="h-full w-full object-cover"
 />
 ) : (
 <Camera className="h-6 w-6 text-muted-foreground" />
 )}
 </button>
 <div className="flex-1 min-w-0">
 <p className="text-sm mb-1">
 {hasFile ? "Looking sharp." : "Add a clear, professional headshot."}
 </p>
 <p className="text-[11px] text-muted-foreground mb-3">
 PNG or JPG, max 4 MB. This shows on your Match card.
 </p>
 <Button variant="outlineGold" size="sm" onClick={onPick}>
 <Upload className="h-4 w-4" />
 {hasFile ? "Replace photo" : "Upload photo"}
 </Button>
 </div>
 <input
 ref={fileRef}
 type="file"
 accept="image/png,image/jpeg,image/jpg,image/webp"
 onChange={onChange}
 className="sr-only"
 />
 </div>
 </div>
);

const ResumeRow = ({
 name,
 size,
 pending,
 onReplace,
 onClear,
}: {
 name: string;
 size: string;
 pending?: boolean;
 onReplace: () => void;
 onClear?: () => void;
}) => (
 <div
 className={`rounded-sm border bg-background p-3 flex items-center gap-3 ${
 pending ? "border-gold" : "border-border"
 }`}
 >
 <div className="h-10 w-10 rounded-sm bg-gold border border-gold flex items-center justify-center flex-shrink-0">
 <FileText className="h-4 w-4 text-white" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm truncate">{name}</p>
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 {size}
 {pending && (
 <span className="text-gold normal-case tracking-normal">
 {" "}
 · Ready to upload
 </span>
 )}
 </p>
 </div>
 <Button variant="ghost" size="sm" onClick={onReplace}>
 Replace
 </Button>
 {onClear && (
 <Button variant="ghost" size="sm" onClick={onClear} aria-label="Remove">
 <Trash2 className="h-4 w-4 text-destructive" />
 </Button>
 )}
 </div>
);

const ModeCard = ({
 icon,
 tag,
 title,
 body,
 onClick,
}: {
 icon: React.ReactNode;
 tag: string;
 title: string;
 body: string;
 onClick: () => void;
}) => (
 <button
 onClick={onClick}
 className="group relative rounded-sm border border-border bg-card p-8 text-left hover:border-gold hover:bg-card transition-all"
 >
 <div className="relative">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gold text-primary-foreground mb-6 group-hover:bg-gold transition-colors">
 {icon}
 </div>
 <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold mb-3">
 {tag}
 </p>
 <h3 className="font-display text-2xl md:text-3xl mb-3">{title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed mb-6">
 {body}
 </p>
 <div className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-foreground group-hover:text-gold transition-colors">
 Pick this
 <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
 </div>
 </div>
 </button>
);

const Footer = ({
 valid,
 working,
 onNext,
 onBack,
 label,
 icon,
}: {
 valid: boolean;
 working: boolean;
 onNext: () => void;
 // Back is optional so the very first step can omit it. Every step
 // after credentials should pass it so the user can walk backwards
 // through the flow without losing context.
 onBack?: () => void;
 label: string;
 icon?: React.ReactNode;
}) => (
 <div className="border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap">
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 {valid ? "Ready when you are" : "Fields marked with * are required"}
 </p>
 <div className="flex items-center gap-3">
 {onBack && (
 <button
 type="button"
 onClick={onBack}
 disabled={working}
 className="inline-flex items-center gap-2 px-5 py-3 rounded-sm font-medium text-sm border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
 >
 <ArrowLeft className="h-4 w-4" />
 Back
 </button>
 )}
 <button
 type="button"
 onClick={onNext}
 disabled={working}
 className={`inline-flex items-center gap-2 px-6 py-3 rounded-sm font-medium text-sm transition-all ${
 valid
 ? "bg-primary text-primary-foreground"
 : "bg-neutral-800 text-muted-foreground border border-border cursor-pointer"
 } ${working ? " cursor-wait" : ""}`}
 >
 {working ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 icon ?? <ArrowRight className="h-4 w-4" />
 )}
 {label}
 </button>
 </div>
 </div>
);
