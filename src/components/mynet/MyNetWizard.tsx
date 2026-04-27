import { useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Hammer,
  Linkedin,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Telescope,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getResumePath,
  setLinkedIn,
  submitProfile,
  updateCandidate,
  uploadResume,
} from "@/lib/mynet-storage";
import {
  CANDIDATE_BIO_MIN,
  CANDIDATE_SKILLS_MIN,
  type Profile,
} from "@/lib/mynet-types";
import {
  COMMITMENT_OPTIONS,
  HEADLINE_OPTIONS,
  LOCATION_OPTIONS,
} from "@/lib/options";

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

const STEP_LABELS = ["Credentials", "Mode", "Details", "Review"] as const;

type Stage = "intro" | "credentials" | "mode" | "looking" | "building";

type Props = {
  uid: string;
  profile: Profile;
  onProfileRefresh: () => void | Promise<void>;
  onSubmitComplete?: () => void;
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
}: Props) => {
  // Rejected users start at credentials so they can update and resubmit.
  const [stage, setStage] = useState<Stage>(
    profile.reviewStatus === "rejected" ? "credentials" : "intro",
  );

  // Step 1 — credentials
  const [linkedin, setLinkedin] = useState(profile.linkedinUrl);
  const [pendingResume, setPendingResume] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3 — looking
  const [fullName, setFullName] = useState(profile.fullName);
  const [headline, setHeadline] = useState(profile.candidate.headline);
  const [bio, setBio] = useState(profile.candidate.bio);
  const [lookingSkills, setLookingSkills] = useState<string[]>(
    profile.candidate.skills,
  );
  const [lookingLocation, setLookingLocation] = useState(
    profile.candidate.location,
  );
  const [lookingCommitment, setLookingCommitment] = useState(
    profile.candidate.commitment,
  );

  // Step 3 — building
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectSkills, setProjectSkills] = useState<string[]>([]);
  const [projectCommitment, setProjectCommitment] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
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

  const credentialsValid = Boolean(
    (linkedin.trim() !== "" && isValidLinkedIn(linkedin)) ||
      pendingResume ||
      profile.resume,
  );

  const lookingValid =
    fullName.trim() !== "" &&
    headline.trim() !== "" &&
    bio.trim().length >= CANDIDATE_BIO_MIN &&
    lookingSkills.length >= CANDIDATE_SKILLS_MIN &&
    lookingLocation.trim() !== "" &&
    lookingCommitment.trim() !== "";

  const buildingValid =
    projectTitle.trim().length >= 2 &&
    projectDesc.trim() !== "" &&
    projectSkills.length >= 1 &&
    projectCommitment.trim() !== "" &&
    projectLocation.trim() !== "";

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
      await onProfileRefresh();
      setStage("mode");
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
      await updateCandidate(
        uid,
        {
          headline: headline.trim(),
          bio: bio.trim(),
          skills: lookingSkills,
          location: lookingLocation.trim(),
          commitment: lookingCommitment.trim(),
          isOpenToWork: true,
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
      await createProject(uid, {
        title: projectTitle.trim(),
        description: projectDesc.trim(),
        criteria: {
          skills: projectSkills,
          commitment: projectCommitment,
          location: projectLocation,
          keywords: projectKeywords.trim(),
        },
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
          eyebrow="Step 01 of 04"
          title="Drop your credentials."
          subtitle="LinkedIn or a resume helps us verify you. We strongly recommend both, but either one will do."
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
                className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
              />
            </Field>

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
          </div>

          <Footer
            valid={credentialsValid}
            onNext={goCredentials}
            working={working}
            label="Continue"
          />
        </StepShell>
      )}

      {stage === "mode" && (
        <StepShell
          eyebrow="Step 02 of 04"
          title="What brings you here?"
          subtitle="Pick the path that fits today. You can always do both later."
          onBack={() => setStage("credentials")}
        >
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            <ModeCard
              icon={<Hammer className="h-6 w-6" />}
              tag="I'm building"
              title="I have a project."
              body="You're working on something and you need a builder, operator, or co-founder next to you."
              onClick={() => setStage("building")}
            />
            <ModeCard
              icon={<Telescope className="h-6 w-6" />}
              tag="I'm looking"
              title="I want to join one."
              body="You're open to joining a project that fits your skills, your time, and the kind of work you want to do."
              onClick={() => setStage("looking")}
            />
          </div>
        </StepShell>
      )}

      {stage === "looking" && (
        <StepShell
          eyebrow="Step 03 of 04"
          title="Tell us about you."
          subtitle="A short pitch and a few specifics so founders can match with you."
          onBack={() => setStage("mode")}
        >
          <div className="space-y-6 mb-10">
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Full name" required>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Marcus Vey"
                  className="h-11 bg-background border-border focus-visible:border-gold/60"
                />
              </Field>
              <Field label="Best fit headline" required>
                <Select value={headline} onValueChange={setHeadline}>
                  <SelectTrigger className="h-11 bg-background border-border focus:border-gold/60">
                    <SelectValue placeholder="Pick the role you fit best" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {HEADLINE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                className="bg-background border-border focus-visible:border-gold/60"
              />
            </Field>

            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Commitment" required>
                <Select
                  value={lookingCommitment}
                  onValueChange={setLookingCommitment}
                >
                  <SelectTrigger className="h-11 bg-background border-border focus:border-gold/60">
                    <SelectValue placeholder="How much can you give?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {COMMITMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Location"
                required
                icon={<MapPin className="h-3.5 w-3.5 text-gold" />}
              >
                <Autocomplete
                  value={lookingLocation}
                  onChange={setLookingLocation}
                  options={LOCATION_OPTIONS}
                  placeholder="Type a city or pick remote..."
                />
              </Field>
            </div>

            <Field
              label="Skills"
              required
              hint={`At least ${CANDIDATE_SKILLS_MIN} skills`}
            >
              <TagInput
                value={lookingSkills}
                onChange={setLookingSkills}
                placeholder="React, Solidity, Go... (Enter to add)"
              />
            </Field>
          </div>

          <Footer
            valid={lookingValid}
            onNext={submitLooking}
            working={working}
            label="Submit for review"
            icon={<Send className="h-4 w-4" />}
          />
        </StepShell>
      )}

      {stage === "building" && (
        <StepShell
          eyebrow="Step 03 of 04"
          title="Tell us what you're building."
          subtitle="Give the project a name and what kind of operator you want next to you."
          onBack={() => setStage("mode")}
        >
          <div className="space-y-6 mb-10">
            <Field label="Project name" required>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Vertical AI for logistics"
                className="h-11 bg-background border-border focus-visible:border-gold/60"
              />
            </Field>

            <Field label="What you're building" required>
              <Textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                rows={3}
                placeholder="One or two sentences. Stage, market, what's already shipped."
                className="bg-background border-border focus-visible:border-gold/60"
              />
            </Field>

            <Field
              label="Skills you need"
              required
              hint="At least one"
            >
              <TagInput
                value={projectSkills}
                onChange={setProjectSkills}
                placeholder="e.g. Rust, Marketplaces, B2B GTM"
              />
            </Field>

            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Commitment" required>
                <Select
                  value={projectCommitment}
                  onValueChange={setProjectCommitment}
                >
                  <SelectTrigger className="h-11 bg-background border-border focus:border-gold/60">
                    <SelectValue placeholder="What you need from them" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {COMMITMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Location"
                required
                icon={<MapPin className="h-3.5 w-3.5 text-gold" />}
              >
                <Autocomplete
                  value={projectLocation}
                  onChange={setProjectLocation}
                  options={LOCATION_OPTIONS}
                  placeholder="Type a city or pick remote..."
                />
              </Field>
            </div>

            <Field label="Keywords" hint="Optional. Helps matching.">
              <Input
                value={projectKeywords}
                onChange={(e) => setProjectKeywords(e.target.value)}
                placeholder="e.g. payments, fintech, ex-Stripe"
                className="h-11 bg-background border-border focus-visible:border-gold/60"
              />
            </Field>
          </div>

          <Footer
            valid={buildingValid}
            onNext={submitBuilding}
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
      body: "Tell us if you're building something or looking to join.",
    },
    {
      num: "03",
      title: "Details",
      body: "Fill in the specifics for the path you picked.",
    },
    {
      num: "04",
      title: "Review",
      body: "Submit and we'll take a look. Usually fast.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto text-center animate-fade-up">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-6">
        <Sparkles className="h-3 w-3 text-gold" />
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold">
          {rejected ? "Resubmit your profile" : "Welcome to MyNet"}
        </span>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl md:text-7xl leading-[0.95] mb-6">
        Set up your <em className="text-gradient-gold not-italic">profile.</em>
      </h1>

      <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-12">
        Four short steps. We&apos;ll get you in front of the right people, and
        keep the network high signal.
      </p>

      {rejected && rejectionReason && (
        <div className="max-w-xl mx-auto mb-10 rounded-sm border border-destructive/40 bg-destructive/5 p-5 text-left">
          <p className="text-[11px] font-mono uppercase tracking-widest text-destructive mb-2">
            Reviewer note
          </p>
          <p className="text-sm leading-relaxed">{rejectionReason}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14 text-left">
        {steps.map((s) => (
          <div
            key={s.num}
            className="relative rounded-sm border border-border bg-card/40 p-6 hover:border-gold/40 transition-colors group"
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
        {rejected ? "Update and resubmit" : "Get started"}
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
                    ? "border-gold/60 bg-gold/10 text-gold"
                    : done
                      ? "border-gold/40 bg-gold/5"
                      : "border-border bg-card/40"
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
                  i < active ? "bg-gold/40" : "bg-border"
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
  <div className="max-w-3xl mx-auto animate-fade-up">
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
      pending ? "border-gold/50" : "border-border"
    }`}
  >
    <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
      <FileText className="h-4 w-4 text-gold" />
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
    className="group relative rounded-sm border border-border bg-card/40 p-8 text-left hover:border-gold/50 hover:bg-card/60 transition-all"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold mb-6 group-hover:bg-gold/20 transition-colors">
        {icon}
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold mb-3">
        {tag}
      </p>
      <h3 className="font-display text-2xl md:text-3xl mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {body}
      </p>
      <div className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-foreground/80 group-hover:text-gold transition-colors">
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
  label,
  icon,
}: {
  valid: boolean;
  working: boolean;
  onNext: () => void;
  label: string;
  icon?: React.ReactNode;
}) => (
  <div className="border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap">
    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
      {valid ? "Ready when you are" : "Fields marked with * are required"}
    </p>
    <button
      onClick={onNext}
      disabled={working}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-sm font-medium text-sm transition-all ${
        valid
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_22px_rgba(59,130,246,0.55)]"
          : "bg-neutral-800/80 text-muted-foreground border border-border cursor-pointer"
      } ${working ? "opacity-60 cursor-wait" : ""}`}
    >
      {working ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon ?? <ArrowRight className="h-4 w-4" />
      )}
      {label}
    </button>
  </div>
);
