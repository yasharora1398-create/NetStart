"use client";
import {
 useEffect,
 useMemo,
 useRef,
 useState,
 type ChangeEvent,
 type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/mynet/TagInput";
import {
 getAvatarUrl,
 setLinkedIn,
 submitProfile,
 updateCandidate,
 uploadAvatar,
} from "@/lib/mynet-storage";
import {
 CANDIDATE_BIO_MIN,
 CANDIDATE_SKILLS_MIN,
 type Availability,
 type PartnerRole,
 type Profile,
} from "@/lib/mynet-types";
import {
 COMMITMENT_OPTIONS,
 LOCATION_OPTIONS,
 PARTNER_ROLE_OPTIONS,
 SKILLS_OPTIONS,
} from "@/lib/options";
import { cn } from "@/lib/utils";

// Full-screen post-signup setup. Lives ONLY here - the legacy
// MyNetWizard is what returning / skipped users see via the
// sidebar. This component is intentionally lean: 5 question
// slides + intro + done, top progress bar + "Skip MyNet" link,
// Next / Previous at the bottom.
//
// Layout: fixed inset with uniform margin so the card matches the
// viewport's aspect ratio with breathing room at the edges. No app
// chrome inside; just the form.

type Props = {
 uid: string;
 profile: Profile;
 onProfileRefresh: () => void | Promise<void>;
 onSkip: () => void;
 onDone: () => void;
};

type SlideKey =
 | "intro"
 | "credentials"
 | "basics"
 | "pitch"
 | "roleSkills"
 | "commitment"
 | "done";

// User-spec'd order. Progress counts the 5 question slides
// (credentials through commitment); intro + done don't count.
const SLIDE_ORDER: SlideKey[] = [
 "intro",
 "credentials",
 "basics",
 "pitch",
 "roleSkills",
 "commitment",
 "done",
];

const AVAILABILITY_OPTIONS: ReadonlyArray<{
 value: Availability;
 label: string;
 hint: string;
}> = [
 {
 value: "closed",
 label: "Closed",
 hint: "Hidden everywhere.",
 },
 {
 value: "discoverable",
 label: "Discoverable",
 hint: "Hidden from the Match deck; findable when founders search for project teammates.",
 },
 {
 value: "open",
 label: "Open to work",
 hint: "In the Match deck and in project-side search.",
 },
];

export const MyNetSignupFlow = ({
 uid,
 profile,
 onProfileRefresh,
 onSkip,
 onDone,
}: Props) => {
 const [slideIdx, setSlideIdx] = useState(0);
 const [submitting, setSubmitting] = useState(false);
 const [mounted, setMounted] = useState(false);

 // Form state. Seeded from the current profile so a returning
 // user (who hit "Reopen the guided setup" from the legacy page)
 // doesn't lose what they've already entered.
 const [linkedin, setLinkedin] = useState(profile.linkedinUrl);
 const [fullName, setFullName] = useState(profile.fullName);
 const [location, setLocation] = useState(profile.candidate.location);
 const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
 const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
 const avatarRef = useRef<HTMLInputElement | null>(null);
 const [bio, setBio] = useState(profile.candidate.bio);
 const [partnerRole, setPartnerRole] = useState<PartnerRole | null>(
 profile.candidate.partnerRole,
 );
 const [skills, setSkills] = useState<string[]>(profile.candidate.skills);
 const [commitment, setCommitment] = useState(profile.candidate.commitment);
 const [availability, setAvailability] = useState<Availability>(
 profile.candidate.availability ?? "open",
 );

 // Entrance fade.
 useEffect(() => {
 const id = window.requestAnimationFrame(() => setMounted(true));
 return () => window.cancelAnimationFrame(id);
 }, []);

 const currentSlide = SLIDE_ORDER[slideIdx];
 const progress = useMemo(() => {
 const questionStart = SLIDE_ORDER.indexOf("credentials");
 const questionEnd = SLIDE_ORDER.indexOf("commitment");
 const total = questionEnd - questionStart + 1;
 const current = slideIdx - questionStart + 1;
 if (current < 1 || current > total) return null;
 return { current, total };
 }, [slideIdx]);

 const goNext = () => {
 if (slideIdx < SLIDE_ORDER.length - 1) setSlideIdx(slideIdx + 1);
 };
 const goPrev = () => {
 if (slideIdx > 0) setSlideIdx(slideIdx - 1);
 };

 const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 if (!file.type.startsWith("image/")) {
 toast.error("Pick an image file.");
 return;
 }
 setPendingAvatar(file);
 const reader = new FileReader();
 reader.onload = () => setAvatarPreview((reader.result as string) ?? null);
 reader.readAsDataURL(file);
 };

 const slideValid = (slide: SlideKey): boolean => {
 switch (slide) {
 case "intro":
 case "done":
 case "credentials":
 // LinkedIn is optional - the wizard always accepted profiles
 // without one.
 return true;
 case "basics":
 // Full name + location required. Picture is optional.
 return fullName.trim() !== "" && location.trim() !== "";
 case "pitch":
 return bio.trim().length >= CANDIDATE_BIO_MIN;
 case "roleSkills":
 return partnerRole !== null && skills.length >= CANDIDATE_SKILLS_MIN;
 case "commitment":
 return commitment.trim() !== "";
 }
 };

 const submit = async () => {
 setSubmitting(true);
 try {
 if (pendingAvatar) {
 await uploadAvatar(uid, pendingAvatar, profile.avatarPath);
 setPendingAvatar(null);
 setAvatarPreview(null);
 }
 if (linkedin.trim()) {
 await setLinkedIn(uid, linkedin.trim());
 }
 await updateCandidate(
 uid,
 {
 headline: profile.candidate.headline,
 bio: bio.trim(),
 skills,
 location: location.trim(),
 commitment: commitment.trim(),
 isOpenToWork: availability === "open",
 availability,
 partnerRole,
 },
 fullName.trim(),
 );
 await submitProfile();
 await onProfileRefresh();
 toast.success("Submitted for review.");
 setSlideIdx(SLIDE_ORDER.length - 1);
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not submit.");
 } finally {
 setSubmitting(false);
 }
 };

 const isLastQuestion = currentSlide === "commitment";
 const isIntro = currentSlide === "intro";
 const isDone = currentSlide === "done";
 const canAdvance = slideValid(currentSlide);

 return (
 // z-40 (not z-60) so Radix portals from inside the card -
 // notably the Select dropdown content at z-50 - layer ABOVE
 // the modal. Otherwise the role dropdown opens but its menu
 // items render behind the card and clicks land on the card
 // backdrop instead.
 <div
 className="fixed inset-0 z-40 bg-background"
 role="dialog"
 aria-modal="true"
 aria-label="Set up MyNet"
 >
 {/* The card. Uniform inset on every edge so the card's
 aspect ratio mirrors the viewport (minus the margin
 strip on every side). bg-background shows around the
 edges. */}
 <div
 className={cn(
 "absolute inset-4 sm:inset-6 md:inset-10 rounded-2xl border-2 border-gold bg-card shadow-2xl flex flex-col overflow-hidden",
 "transition-opacity duration-300",
 mounted ? "opacity-100" : "opacity-0",
 )}
 >
 {/* Top bar: progress (left) + Skip MyNet (right). */}
 <div className="flex items-center justify-between gap-4 px-5 sm:px-8 pt-5">
 <div className="flex-1 min-w-0">
 {progress ? (
 <>
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
 Step {progress.current} of {progress.total}
 </p>
 <div className="relative h-0.5 rounded-full bg-border overflow-hidden">
 <div
 className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-500 ease-out"
 style={{
 width: `${(progress.current / progress.total) * 100}%`,
 }}
 />
 </div>
 </>
 ) : null}
 </div>
 {!isDone ? (
 <button
 type="button"
 onClick={onSkip}
 className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
 >
 <X className="h-3.5 w-3.5" />
 Skip MyNet
 </button>
 ) : null}
 </div>

 {/* Slide body. Centered horizontally, scrollable when
 needed. Key on currentSlide so the slide-in-right
 animation plays on every change. */}
 <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-8 sm:py-12">
 <div
 key={currentSlide}
 className="max-w-xl mx-auto w-full animate-slide-in-right"
 >
 {currentSlide === "intro" ? (
 <IntroSlide />
 ) : currentSlide === "credentials" ? (
 <QuestionSlide
 eyebrow="Credentials"
 title="Drop your LinkedIn."
 subtitle="Optional but recommended. Helps the reviewer trust your profile faster."
 >
 <Input
 autoFocus
 type="url"
 value={linkedin}
 onChange={(e) => setLinkedin(e.target.value)}
 placeholder="https://www.linkedin.com/in/..."
 className="h-12 bg-background border-border focus-visible:border-gold text-base"
 />
 </QuestionSlide>
 ) : currentSlide === "basics" ? (
 <QuestionSlide
 eyebrow="The basics"
 title="Profile picture, name, and where you are."
 subtitle="Name and location are required. The photo is optional but a real face gets more responses."
 >
 <div className="space-y-6">
 <PhotoPicker
 previewUrl={avatarPreview ?? getAvatarUrl(profile.avatarPath)}
 onPick={() => avatarRef.current?.click()}
 fileRef={avatarRef}
 onChange={onPickAvatar}
 />
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
 Full name <span className="text-destructive">*</span>
 </Label>
 <Input
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 placeholder="Marcus Vey"
 className="h-12 bg-background border-border focus-visible:border-gold text-base"
 />
 </div>
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
 Location <span className="text-destructive">*</span>
 </Label>
 <Autocomplete
 value={location}
 onChange={setLocation}
 options={LOCATION_OPTIONS}
 placeholder="City, country, or remote..."
 />
 </div>
 </div>
 </QuestionSlide>
 ) : currentSlide === "pitch" ? (
 <QuestionSlide
 eyebrow="Your pitch"
 title="Tell us about you."
 subtitle={`What you've shipped. Where you want to focus next. Why a founder should reach out. (${bio.trim().length}/${CANDIDATE_BIO_MIN} min)`}
 >
 <Textarea
 autoFocus
 value={bio}
 onChange={(e) => setBio(e.target.value)}
 rows={6}
 placeholder="I'm a senior product designer who shipped..."
 className="bg-background border-border focus-visible:border-gold text-base"
 />
 </QuestionSlide>
 ) : currentSlide === "roleSkills" ? (
 <QuestionSlide
 eyebrow="Role + skills"
 title="What role do you want, and what do you bring?"
 subtitle="The C-suite seat you'd step into at the next venture, plus the skills that back it up."
 >
 <div className="space-y-6">
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
 Role <span className="text-destructive">*</span>
 </Label>
 <Select
 value={partnerRole ?? undefined}
 onValueChange={(v) => setPartnerRole(v as PartnerRole)}
 >
 <SelectTrigger className="h-12 bg-background border-border focus-visible:border-gold text-base">
 <SelectValue placeholder="Pick a role" />
 </SelectTrigger>
 <SelectContent>
 {PARTNER_ROLE_OPTIONS.map((opt) => (
 <SelectItem key={opt.value} value={opt.value}>
 {opt.label} — {opt.description}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
 Skills <span className="text-destructive">*</span>
 <span className="ml-2 text-muted-foreground normal-case tracking-normal font-sans">
 (at least {CANDIDATE_SKILLS_MIN})
 </span>
 </Label>
 <TagInput
 value={skills}
 onChange={setSkills}
 options={SKILLS_OPTIONS}
 placeholder="Type or pick..."
 />
 </div>
 </div>
 </QuestionSlide>
 ) : currentSlide === "commitment" ? (
 <QuestionSlide
 eyebrow="Commitment + visibility"
 title="How much can you give, and how visible do you want to be?"
 subtitle="Full-time, part-time, advisory - whatever fits your bandwidth. Then pick how reachable you want to be on Polln8."
 >
 <div className="space-y-6">
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
 Commitment <span className="text-destructive">*</span>
 </Label>
 <Autocomplete
 value={commitment}
 onChange={setCommitment}
 options={COMMITMENT_OPTIONS}
 placeholder="Type or pick..."
 />
 </div>
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
 Visibility
 </Label>
 <AvailabilityRow
 value={availability}
 onChange={setAvailability}
 />
 </div>
 </div>
 </QuestionSlide>
 ) : (
 <DoneSlide onContinue={onDone} />
 )}
 </div>
 </div>

 {/* Bottom bar: Previous + Next / Submit. Hidden on intro
 (its own single Get-started button) and done. */}
 {!isIntro && !isDone ? (
 <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-5 border-t border-border">
 <Button
 variant="outline"
 size="lg"
 onClick={goPrev}
 disabled={submitting}
 className="min-h-[44px]"
 >
 <ArrowLeft className="h-4 w-4" />
 Previous
 </Button>
 {isLastQuestion ? (
 <Button
 variant="gold"
 size="lg"
 onClick={submit}
 disabled={submitting || !canAdvance}
 className="min-h-[44px]"
 >
 {submitting ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Submitting…
 </>
 ) : (
 <>
 Finish
 <ArrowRight className="h-4 w-4" />
 </>
 )}
 </Button>
 ) : (
 <Button
 variant="gold"
 size="lg"
 onClick={goNext}
 disabled={!canAdvance || submitting}
 className="min-h-[44px]"
 >
 Next
 <ArrowRight className="h-4 w-4" />
 </Button>
 )}
 </div>
 ) : null}

 {isIntro ? (
 <div className="flex items-center justify-center gap-4 px-5 sm:px-8 py-5 border-t border-border">
 <Button variant="gold" size="lg" onClick={goNext} className="min-h-[44px]">
 Get started
 <ArrowRight className="h-4 w-4" />
 </Button>
 </div>
 ) : null}
 </div>
 </div>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

const QuestionSlide = ({
 eyebrow,
 title,
 subtitle,
 children,
}: {
 eyebrow: string;
 title: string;
 subtitle: string;
 children: ReactNode;
}) => (
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-3">
 {eyebrow}
 </p>
 <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] mb-3">
 {title}
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-lg leading-relaxed">
 {subtitle}
 </p>
 <div>{children}</div>
 </div>
);

const IntroSlide = () => (
 <div className="text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold bg-gold mb-6">
 <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-white">
 Welcome to MyNet
 </span>
 </div>
 <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1] mb-5">
 This is <em className="text-gradient-gold not-italic">MyNet.</em>
 </h1>
 <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-3">
 Your profile on Polln8. It&apos;s how every founder discovers you,
 decides if it&apos;s worth a chat, and trusts that you&apos;re real.
 </p>
 <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
 Every match starts here. Five short questions, less than a minute.
 </p>
 </div>
);

const DoneSlide = ({ onContinue }: { onContinue: () => void }) => (
 <div className="text-center">
 <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-6">
 <ArrowRight className="h-8 w-8" strokeWidth={2.4} />
 </div>
 <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-3">
 MyNet is live.
 </h2>
 <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-8">
 Submitted for review. We&apos;ll get you into the deck in under a
 day. Let&apos;s find your person.
 </p>
 <Button variant="gold" size="lg" onClick={onContinue} className="min-h-[44px]">
 Open MyNet
 <ArrowRight className="h-4 w-4" />
 </Button>
 </div>
);

const PhotoPicker = ({
 previewUrl,
 onPick,
 fileRef,
 onChange,
}: {
 previewUrl: string | null;
 onPick: () => void;
 fileRef: React.RefObject<HTMLInputElement | null>;
 onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => (
 <div className="flex items-center gap-5">
 <button
 type="button"
 onClick={onPick}
 className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-border bg-muted hover:border-gold transition-colors flex items-center justify-center flex-shrink-0"
 aria-label="Pick a profile picture"
 >
 {previewUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={previewUrl}
 alt=""
 className="absolute inset-0 h-full w-full object-cover"
 />
 ) : (
 <Camera className="h-7 w-7 text-muted-foreground" strokeWidth={1.4} />
 )}
 </button>
 <div className="min-w-0">
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1 block">
 Profile picture (optional)
 </Label>
 <p className="text-xs text-muted-foreground">
 {previewUrl ? "Tap the photo to change." : "Tap the circle to add."}
 </p>
 </div>
 <input
 ref={fileRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={onChange}
 />
 </div>
);

// 3-way availability row. Same semantics as the AvailabilityPicker
// in MyNetDashboard but laid out vertically with the hint inline
// so the user understands each option's effect before they pick.
const AvailabilityRow = ({
 value,
 onChange,
}: {
 value: Availability;
 onChange: (next: Availability) => void;
}) => (
 <div className="space-y-2">
 {AVAILABILITY_OPTIONS.map((opt) => {
 const active = opt.value === value;
 return (
 <button
 key={opt.value}
 type="button"
 onClick={() => onChange(opt.value)}
 className={cn(
 "w-full text-left rounded-sm border p-4 transition-colors min-h-[44px]",
 active
 ? "border-gold bg-gold/10"
 : "border-border bg-background hover:border-gold",
 )}
 >
 <p
 className={cn(
 "font-medium text-sm mb-0.5",
 active ? "text-gold" : "text-foreground",
 )}
 >
 {opt.label}
 </p>
 <p className="text-xs text-muted-foreground leading-relaxed">
 {opt.hint}
 </p>
 </button>
 );
 })}
 </div>
);

export default MyNetSignupFlow;
