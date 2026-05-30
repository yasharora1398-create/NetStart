import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowRight,
 BadgeCheck,
 Briefcase,
 CheckCircle2,
 ExternalLink,
 Eye,
 FileText,
 Hammer,
 Hourglass,
 Linkedin,
 Loader2,
 MapPin,
 Pencil,
 Plus,
 Save,
 Telescope,
 Trash2,
 User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProfileCard } from "./ProfileCard";
import { CandidateCard } from "./CandidateCard";
import { ProjectCard } from "./ProjectCard";
import type { ProfileSubmission } from "./ProfileCard";
import { getAvatarUrl, updateExtendedProfile } from "@/lib/mynet-storage";
import type {
 CandidateProfile,
 Profile,
 Project,
 ProjectLifecycle,
} from "@/lib/mynet-types";
import { RoleSwitcher, type Role } from "@/components/netstart/RoleSwitcher";

type Props = {
 profile: Profile;
 projects: Project[];
 onSubmitProfile: (changes: ProfileSubmission) => Promise<void>;
 onSaveCandidate: (data: {
 candidate: CandidateProfile;
 fullName: string;
 }) => Promise<void>;
 onToggleOpenToWork: (value: boolean) => Promise<void>;
 onUploadAvatar: (file: File) => Promise<void>;
 onRemoveAvatar: () => Promise<void>;
 onNewProject: () => void;
 onOpenProject: (id: string) => void;
 onEditProject: (project: Project) => void;
 onDeleteProject: (project: Project) => void;
 onFindPeople: (id: string) => void;
 onTogglePublish: (project: Project) => void;
 onSetLifecycle: (project: Project, state: ProjectLifecycle) => void;
 /** Toggle the founder's active project (drives Match). */
 onSetActiveProject: (projectId: string | null) => void;
 /** Current role read from auth metadata. */
 role: Role;
 /** Called after the role switch persists; parent refreshes session. */
 onRoleSwitched: (role: Role) => void | Promise<void>;
 /** Signed-in user id - needed for the verified-founder extended
 * profile writes (updateExtendedProfile RPC takes user_id). */
 userId: string;
 /** Bubble up extended-profile saves so the parent's profile state
 * stays in sync without a refetch round-trip. */
 onSavedExtended: (next: Profile) => void;
};

const formatBytes = (bytes: number): string => {
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const initials = (name: string): string => {
 if (!name.trim()) return "?";
 return name
 .trim()
 .split(/\s+/)
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? "")
 .join("");
};

export const MyNetDashboard = ({
 profile,
 projects,
 onSubmitProfile,
 onSaveCandidate,
 onToggleOpenToWork,
 onUploadAvatar,
 onRemoveAvatar,
 onNewProject,
 onOpenProject,
 onEditProject,
 onDeleteProject,
 onFindPeople,
 onTogglePublish,
 onSetLifecycle,
 onSetActiveProject,
 role,
 onRoleSwitched,
 userId,
 onSavedExtended,
}: Props) => {
 const [editing, setEditing] = useState(false);

 const hasProjects = projects.length > 0;
 const isPending = profile.reviewStatus === "pending";

 return (
 <>
 {/* Header - Edit toggle now lives up top so the user can flip
 into edit mode the moment they land on the page, instead of
 scrolling to the bottom to find the button. */}
 <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
 <div>
 {isPending ? (
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold bg-gold mb-6">
 <Hourglass className="h-3 w-3 text-white" />
 <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white">
 Review pending
 </span>
 </div>
 ) : (
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary bg-primary mb-6">
 <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
 <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary-foreground">
 Accepted
 </span>
 </div>
 )}
 <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] mb-3">
 Your <em className="text-gradient-gold not-italic">profile.</em>
 </h1>
 <p className="text-muted-foreground max-w-xl">
 {editing
 ? "Editing. Make your changes and click Done."
 : isPending
 ? "Submitted. We'll review your credentials shortly - feel free to keep building below."
 : "Everything you've set up, at a glance."}
 </p>
 </div>
 <div className="shrink-0 flex flex-col items-end gap-3">
 <RoleSwitcher
 currentRole={role}
 onSwitched={onRoleSwitched}
 />
 {editing ? (
 <Button
 variant="gold"
 size="xl"
 onClick={() => setEditing(false)}
 >
 <CheckCircle2 className="h-4 w-4" />
 Done editing
 </Button>
 ) : (
 <Button
 variant="outlineGold"
 size="xl"
 onClick={() => setEditing(true)}
 >
 <Pencil className="h-4 w-4" />
 Edit profile
 </Button>
 )}
 </div>
 </header>

 {/* CREDENTIALS - always shown */}
 <Section title="Credentials" eyebrow="01">
 {editing ? (
 <ProfileCard
 profile={profile}
 role={role}
 onSubmit={onSubmitProfile}
 />
 ) : (
 <CredentialsDisplay profile={profile} role={role} />
 )}
 </Section>

 {/* PREVIEW - shows the user the same card others see. Helps
 them spot bad copy / missing fields before they go live. */}
 {!editing ? (
 <Section
 title="How others see you"
 eyebrow="01.5"
 icon={<Eye className="h-3.5 w-3.5 text-gold" />}
 >
 <MyCardPreview
 profile={profile}
 projects={projects}
 role={role}
 />
 </Section>
 ) : null}

 {/* LOOKING - always shown. Empty candidate gets the editor by
 default while editing, or a "tell us about you" prompt
 when read-only. The Open-to-Work toggle lives in the
 section header so users can flip discoverability without
 having to enter edit mode. */}
 <Section
 title="How partners find you"
 eyebrow="02"
 icon={<Telescope className="h-3.5 w-3.5 text-gold" />}
 action={
 <OpenToWorkToggle
 open={profile.candidate.isOpenToWork}
 onToggle={onToggleOpenToWork}
 />
 }
 >
 {editing ? (
 <CandidateCard
 profile={profile}
 onSave={onSaveCandidate}
 onUploadAvatar={onUploadAvatar}
 onRemoveAvatar={onRemoveAvatar}
 />
 ) : (
 <CandidateDisplay profile={profile} />
 )}

 {!editing && profile.candidate.isOpenToWork && (
 <div className="mt-6 block rounded-sm border border-gold bg-card p-6">
 <div className="flex items-center justify-between gap-4">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1">
 Find projects · Coming soon
 </p>
 <h3 className="font-display text-2xl mb-1">
 Browse open projects
 </h3>
 <p className="text-sm text-muted-foreground">
 We&apos;re lining up the founder side. You&apos;ll be able to
 browse projects ranked against your profile at launch.
 </p>
 </div>
 </div>
 </div>
 )}
 </Section>

 {/* BUILDING - founders only. Empty state surfaces a "New project"
 card so the user knows the section is even here. Pending users
 can preview the surface but the action buttons are gated until
 their submission is approved. */}
 {role === "founder" ? (
 <Section
 title="What you're building"
 eyebrow="03"
 icon={<Hammer className="h-3.5 w-3.5 text-gold" />}
 action={
 <Button
 variant="gold"
 size="lg"
 onClick={onNewProject}
 disabled={isPending}
 title={
 isPending ? "Available once your review is approved." : undefined
 }
 >
 <Plus className="h-4 w-4" />
 New project
 </Button>
 }
 >
 {!hasProjects ? (
 <button
 type="button"
 onClick={onNewProject}
 disabled={isPending}
 className="w-full rounded-sm border border-dashed border-border hover:border-gold disabled:hover:border-border disabled:cursor-not-allowed disabled: bg-card hover:bg-card disabled:hover:bg-card transition-colors p-8 text-left group"
 >
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
 {isPending ? "Locked · Review pending" : "Empty"}
 </p>
 <h3 className="font-display text-2xl mb-2">
 {isPending
 ? "You can post a project once you're approved."
 : "You haven't posted a project yet."}
 </h3>
 <p className="text-sm text-muted-foreground mb-4 max-w-md">
 {isPending
 ? "We're reviewing your credentials. The moment you're in, this section unlocks."
 : "Add what you're building so partners can find and apply to your venture."}
 </p>
 {!isPending && (
 <span className="inline-flex items-center gap-2 text-sm text-gold group-hover:gap-3 transition-all">
 <Plus className="h-4 w-4" />
 Start a project
 </span>
 )}
 </button>
 ) : (
 <div className="grid md:grid-cols-2 gap-4">
 {projects.map((p) => (
 <ProjectCard
 key={p.id}
 project={p}
 onOpen={() => onOpenProject(p.id)}
 onEdit={() => onEditProject(p)}
 onDelete={() => onDeleteProject(p)}
 onFindPeople={() => onFindPeople(p.id)}
 onTogglePublish={() => onTogglePublish(p)}
 onSetLifecycle={(state) => onSetLifecycle(p, state)}
 isActive={profile.activeProjectId === p.id}
 onSetActive={() =>
 onSetActiveProject(
 profile.activeProjectId === p.id ? null : p.id,
 )
 }
 />
 ))}
 </div>
 )}
 </Section>
 ) : null}

 {/* VERIFIED-FOUNDER PERK SECTIONS. Render only for founders
 with profile.is_verified_founder = true (paid feature).
 Each section is a normal Section card with its own Save
 button so it reads as native MyNet surface. */}
 {role === "founder" && profile.isVerifiedFounder ? (
 <>
 <Section
 title="Your venture, deeper"
 eyebrow="04"
 icon={<BadgeCheck className="h-3.5 w-3.5 text-primary" />}
 >
 <AboutVentureBody
 profile={profile}
 userId={userId}
 onSaved={onSavedExtended}
 />
 </Section>
 <Section
 title="Pitch deck link"
 eyebrow="05"
 icon={<BadgeCheck className="h-3.5 w-3.5 text-primary" />}
 >
 <PitchLinkBody
 profile={profile}
 userId={userId}
 onSaved={onSavedExtended}
 />
 </Section>
 <Section
 title="Project links"
 eyebrow="06"
 icon={<BadgeCheck className="h-3.5 w-3.5 text-primary" />}
 >
 <ProjectLinksBody
 profile={profile}
 userId={userId}
 onSaved={onSavedExtended}
 />
 </Section>
 <Section
 title="What collaborators say"
 eyebrow="07"
 icon={<BadgeCheck className="h-3.5 w-3.5 text-primary" />}
 >
 <ReferencesBody
 profile={profile}
 userId={userId}
 onSaved={onSavedExtended}
 />
 </Section>
 </>
 ) : null}

 {/* Bottom CTA: jump to /u/<self-id> so the user sees the same
 page that partners + founders see. Click-through hits the
 customizable public profile (banner + pfp + 2-col layout). */}
 {userId ? (
 <Link
 to={`/u/${userId}`}
 className="block rounded-sm border border-gold bg-card hover:bg-gold/5 transition-colors p-6 group"
 >
 <div className="flex items-center justify-between gap-4">
 <div className="min-w-0">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1 flex items-center gap-1.5">
 <Eye className="h-3 w-3" />
 Preview
 </p>
 <h3 className="font-display text-2xl leading-tight">
 See how others view your profile
 </h3>
 <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
 The same page partners land on after they accept your card -
 banner, photo, bio, pitch, links, projects. Edit the banner
 right on the page.
 </p>
 </div>
 <ArrowRight className="h-6 w-6 text-gold flex-shrink-0 group-hover:translate-x-1 transition-transform" />
 </div>
 </Link>
 ) : null}

 </>
 );
};

// ===== Display sub-components =====

const Section = ({
 title,
 action,
 children,
}: {
 title: string;
 // Legacy props (eyebrow, icon) intentionally accepted but ignored
 // so we don't have to touch every call site. They no longer render.
 eyebrow?: string;
 icon?: React.ReactNode;
 action?: React.ReactNode;
 children: React.ReactNode;
}) => (
 <section className="mb-12">
 <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
 <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
 {action}
 </div>
 {children}
 </section>
);

// Standalone Open-to-Work toggle. Lives in the "How partners find you"
// section header so users can flip discoverability on/off without
// having to enter edit mode. Both directions are always allowed " the
// parent handler is permissive, and forcing eligibility checks here
// turned the switch into a one-way trap when a profile was incomplete.
const OpenToWorkToggle = ({
 open,
 onToggle,
}: {
 open: boolean;
 onToggle: (value: boolean) => Promise<void>;
}) => {
 const [busy, setBusy] = useState(false);
 const handleChange = async (next: boolean) => {
 setBusy(true);
 try {
 await onToggle(next);
 toast.success(next ? "Visible to founders." : "Hidden from search.");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not update.");
 } finally {
 setBusy(false);
 }
 };
 return (
 <div className="flex items-center gap-3">
 <span
 className={`text-[11px] font-mono uppercase tracking-[0.18em] ${
 open ? "text-gold" : "text-muted-foreground"
 }`}
 >
 {open ? "Open to work" : "Closed"}
 </span>
 <Switch
 checked={open}
 onCheckedChange={handleChange}
 disabled={busy}
 aria-label="Open to work"
 />
 </div>
 );
};

const InfoRow = ({
 label,
 children,
}: {
 label: string;
 children: React.ReactNode;
}) => (
 <div>
 <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
 {label}
 </dt>
 <dd className="text-sm leading-relaxed">{children}</dd>
 </div>
);

const CredentialsDisplay = ({
 profile,
 role,
}: {
 profile: Profile;
 role: Role;
}) => (
 <div className="rounded-sm border border-border bg-card p-6 md:p-8 grid md:grid-cols-2 gap-8">
 <InfoRow label="LinkedIn">
 {profile.linkedinUrl ? (
 <a
 href={profile.linkedinUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 text-gold hover:underline break-all"
 >
 <Linkedin className="h-4 w-4 flex-shrink-0" />
 <span className="break-all">{profile.linkedinUrl}</span>
 <ExternalLink className="h-3 w-3 flex-shrink-0" />
 </a>
 ) : (
 <span className="text-muted-foreground">Not added</span>
 )}
 </InfoRow>

 {role === "founder" ? (
 <>
 <InfoRow label="Website">
 {profile.websiteUrl ? (
 <a
 href={profile.websiteUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 text-gold hover:underline break-all"
 >
 <span className="break-all">{profile.websiteUrl}</span>
 <ExternalLink className="h-3 w-3 flex-shrink-0" />
 </a>
 ) : (
 <span className="text-muted-foreground">Not added</span>
 )}
 </InfoRow>

 <InfoRow label="Proof of work">
 {profile.proof ? (
 <div className="inline-flex items-center gap-3">
 <div className="h-10 w-10 rounded-sm bg-muted border border-border flex items-center justify-center flex-shrink-0">
 <FileText className="h-4 w-4 text-white" />
 </div>
 <div className="min-w-0">
 <p className="text-sm truncate">{profile.proof.name}</p>
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 {formatBytes(profile.proof.size)}
 </p>
 </div>
 </div>
 ) : (
 <span className="text-muted-foreground">Not uploaded</span>
 )}
 </InfoRow>
 </>
 ) : (
 <InfoRow label="Resume">
 {profile.resume ? (
 <div className="inline-flex items-center gap-3">
 <div className="h-10 w-10 rounded-sm bg-muted border border-border flex items-center justify-center flex-shrink-0">
 <FileText className="h-4 w-4 text-white" />
 </div>
 <div className="min-w-0">
 <p className="text-sm truncate">{profile.resume.name}</p>
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 {formatBytes(profile.resume.size)}
 </p>
 </div>
 </div>
 ) : (
 <span className="text-muted-foreground">Not uploaded</span>
 )}
 </InfoRow>
 )}
 </div>
);

const CandidateDisplay = ({ profile }: { profile: Profile }) => {
 const c = profile.candidate;
 const avatarUrl = getAvatarUrl(profile.avatarPath);

 return (
 <div className="rounded-sm border border-border bg-card p-6 md:p-8">
 <div className="flex items-start gap-5 mb-6">
 {avatarUrl ? (
 <img
 src={avatarUrl}
 alt={profile.fullName}
 className="h-20 w-20 rounded-sm object-cover border border-gold flex-shrink-0"
 />
 ) : (
 <div className="h-20 w-20 rounded-sm bg-muted border border-border flex items-center justify-center flex-shrink-0">
 <User className="h-10 w-10 text-muted-foreground" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <h3 className="font-display text-2xl mb-1">
 {profile.fullName || "Unnamed"}
 </h3>
 {c.headline && (
 <p className="text-sm text-muted-foreground mb-3">{c.headline}</p>
 )}
 <div className="flex flex-wrap items-center gap-2">
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-widest ${
 c.isOpenToWork
 ? "border-primary bg-primary text-primary-foreground"
 : "border-border bg-background text-muted-foreground"
 }`}
 >
 <span
 className={`h-1.5 w-1.5 rounded-full ${
 c.isOpenToWork ? "bg-emerald-400" : "bg-muted-foreground"
 }`}
 />
 {c.isOpenToWork ? "Open to work" : "Not open"}
 </span>
 {c.commitment && (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
 <Briefcase className="h-3 w-3 text-gold" />
 {c.commitment}
 </span>
 )}
 {c.location && (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
 <MapPin className="h-3 w-3 text-gold" />
 {c.location}
 </span>
 )}
 </div>
 </div>
 </div>

 {c.bio && (
 <div className="mb-6">
 <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
 Pitch / Bio
 </p>
 <p className="text-sm leading-relaxed whitespace-pre-line">{c.bio}</p>
 </div>
 )}

 {c.skills.length > 0 && (
 <div>
 <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
 Skills
 </p>
 <div className="flex flex-wrap gap-1.5">
 {c.skills.map((s) => (
 <span
 key={s}
 className="px-2.5 py-1 text-xs rounded-sm border border-gold bg-gold"
 >
 {s}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 );
};

// Renders the user's profile / project the way the OTHER side of
// the network sees it on Match. Partners see their own candidate
// card (what founders flip through); founders see their active
// project card (what partners see). Helps the user catch missing
// fields, weak copy, or a stale photo before going live.
const MyCardPreview = ({
 profile,
 projects,
 role,
}: {
 profile: Profile;
 projects: Project[];
 role: Role;
}) => {
 if (role === "partner") {
 return <CandidatePreviewCard profile={profile} />;
 }
 // Founder POV: prefer the active project, fall back to the first.
 const active =
 projects.find((p) => p.id === profile.activeProjectId) ?? projects[0];
 if (!active) {
 return (
 <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
 <h3 className="font-display text-xl mb-2">No project to preview</h3>
 <p className="text-sm text-muted-foreground max-w-md mx-auto">
 Post a project below and it'll appear here as partners will see it
 on Match.
 </p>
 </div>
 );
 }
 return <ProjectPreviewCard project={active} profile={profile} />;
};

const CandidatePreviewCard = ({ profile }: { profile: Profile }) => {
 const url = getAvatarUrl(profile.avatarPath);
 const c = profile.candidate;
 return (
 <article className="mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-gold bg-card shadow-sm">
 <div className="relative w-full aspect-square bg-gold">
 {url ? (
 <img
 src={url}
 alt={profile.fullName}
 className="absolute inset-0 h-full w-full object-cover"
 loading="lazy"
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center">
 <span className="font-display text-7xl text-gold">
 {(profile.fullName.trim()[0] ?? "?").toUpperCase()}
 </span>
 </div>
 )}
 </div>
 <div className="p-5">
 <h3 className="mb-2 font-display text-2xl leading-tight">
 {profile.fullName || "Unnamed"}
 </h3>
 {(c.commitment || c.location || c.skills.length > 0) ? (
 <div className="mb-3 flex flex-wrap gap-1.5">
 {c.commitment ? <PreviewPill>{c.commitment}</PreviewPill> : null}
 {c.location ? <PreviewPill>{c.location}</PreviewPill> : null}
 {c.skills.slice(0, 5).map((s) => (
 <PreviewPill key={s} muted>
 {s}
 </PreviewPill>
 ))}
 </div>
 ) : null}
 {c.headline ? (
 <p className="mb-2 text-sm font-medium text-foreground">
 {c.headline}
 </p>
 ) : null}
 {c.bio ? (
 <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
 {c.bio}
 </p>
 ) : (
 <p className="text-sm italic text-muted-foreground">
 No bio yet. Founders see a blank pitch where this would be.
 </p>
 )}
 </div>
 </article>
 );
};

const ProjectPreviewCard = ({
 project,
 profile,
}: {
 project: Project;
 profile: Profile;
}) => {
 const url = getAvatarUrl(profile.avatarPath);
 return (
 <article className="mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-gold bg-card shadow-sm">
 <div className="relative w-full aspect-square bg-gold">
 {url ? (
 <img
 src={url}
 alt={profile.fullName}
 className="absolute inset-0 h-full w-full object-cover"
 loading="lazy"
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center">
 <span className="font-display text-7xl text-gold">
 {(profile.fullName.trim()[0] ?? "?").toUpperCase()}
 </span>
 </div>
 )}
 </div>
 <div className="p-5">
 <h3 className="mb-1 font-display text-2xl leading-tight">
 {project.title || "Untitled project"}
 </h3>
 <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
 by {profile.fullName || "Anonymous"}
 </p>
 {project.businessType ||
 project.criteria.commitment ||
 project.criteria.location ||
 project.criteria.skills.length > 0 ? (
 <div className="mb-3 flex flex-wrap gap-1.5">
 {project.businessType ? (
 <PreviewPill>{project.businessType}</PreviewPill>
 ) : null}
 {project.criteria.commitment ? (
 <PreviewPill>{project.criteria.commitment}</PreviewPill>
 ) : null}
 {project.criteria.location ? (
 <PreviewPill>{project.criteria.location}</PreviewPill>
 ) : null}
 {project.criteria.skills.slice(0, 5).map((s) => (
 <PreviewPill key={s} muted>
 {s}
 </PreviewPill>
 ))}
 </div>
 ) : null}
 {project.description ? (
 <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
 {project.description}
 </p>
 ) : (
 <p className="text-sm italic text-muted-foreground">
 No description yet. Partners see a blank pitch here.
 </p>
 )}
 </div>
 </article>
 );
};

const PreviewPill = ({
 children,
 muted,
}: {
 children: React.ReactNode;
 muted?: boolean;
}) => (
 <span
 className={
 muted
 ? "rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
 : "inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-primary-foreground"
 }
 >
 {children}
 </span>
);

// ===== Verified-founder section bodies ============================
//
// Each body is self-contained: holds local edit state, calls
// updateExtendedProfile on Save, then bubbles the new Profile up
// through onSaved so the parent's state stays current without a
// refetch. Re-sync from props on profile change so a parent-side
// refresh doesn't silently overwrite remote changes.

const ExtendedSaveButton = ({
 saving,
 onClick,
}: {
 saving: boolean;
 onClick: () => void;
}) => (
 <div className="flex justify-end mt-4">
 <Button
 type="button"
 variant="gold"
 size="sm"
 onClick={onClick}
 disabled={saving}
 >
 {saving ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Save className="h-4 w-4" />
 )}
 Save
 </Button>
 </div>
);

const AboutVentureBody = ({
 profile,
 userId,
 onSaved,
}: {
 profile: Profile;
 userId: string;
 onSaved: (next: Profile) => void;
}) => {
 const [value, setValue] = useState(profile.extendedDescription);
 const [saving, setSaving] = useState(false);
 useEffect(() => {
 setValue(profile.extendedDescription);
 }, [profile.extendedDescription]);
 const handleSave = async () => {
 if (saving) return;
 setSaving(true);
 try {
 await updateExtendedProfile(userId, {
 extendedDescription: value,
 pitchUrl: profile.pitchUrl,
 projectLinks: profile.projectLinks,
 collaboratorReferences: profile.collaboratorReferences,
 });
 onSaved({ ...profile, extendedDescription: value });
 toast.success("About saved.");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not save.");
 } finally {
 setSaving(false);
 }
 };
 return (
 <div>
 <p className="text-sm text-muted-foreground mb-3">
 Standard profiles get a one-line headline. With the verified
 perk you have room for the full story.
 </p>
 <textarea
 value={value}
 onChange={(e) => setValue(e.target.value)}
 rows={8}
 placeholder="What you're building, why it matters, where you are with it. Take as much room as you want."
 className="w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
 />
 <ExtendedSaveButton saving={saving} onClick={handleSave} />
 </div>
 );
};

const PitchLinkBody = ({
 profile,
 userId,
 onSaved,
}: {
 profile: Profile;
 userId: string;
 onSaved: (next: Profile) => void;
}) => {
 const [value, setValue] = useState(profile.pitchUrl);
 const [saving, setSaving] = useState(false);
 useEffect(() => {
 setValue(profile.pitchUrl);
 }, [profile.pitchUrl]);
 const handleSave = async () => {
 if (saving) return;
 setSaving(true);
 try {
 const trimmed = value.trim();
 await updateExtendedProfile(userId, {
 extendedDescription: profile.extendedDescription,
 pitchUrl: trimmed,
 projectLinks: profile.projectLinks,
 collaboratorReferences: profile.collaboratorReferences,
 });
 onSaved({ ...profile, pitchUrl: trimmed });
 toast.success("Pitch link saved.");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not save.");
 } finally {
 setSaving(false);
 }
 };
 return (
 <div>
 <p className="text-sm text-muted-foreground mb-3">
 Anywhere your deck or full pitch already lives - Google Slides,
 Notion, hosted PDF. Partners open it from your profile.
 </p>
 <input
 type="url"
 value={value}
 onChange={(e) => setValue(e.target.value)}
 placeholder="https://docs.google.com/presentation/..."
 className="w-full h-11 rounded-sm border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
 />
 <ExtendedSaveButton saving={saving} onClick={handleSave} />
 </div>
 );
};

const ProjectLinksBody = ({
 profile,
 userId,
 onSaved,
}: {
 profile: Profile;
 userId: string;
 onSaved: (next: Profile) => void;
}) => {
 const [links, setLinks] = useState(profile.projectLinks);
 const [saving, setSaving] = useState(false);
 useEffect(() => {
 setLinks(profile.projectLinks);
 }, [profile.projectLinks]);
 const handleSave = async () => {
 if (saving) return;
 setSaving(true);
 try {
 const cleaned = links
 .map((l) => ({ title: l.title.trim(), url: l.url.trim() }))
 .filter((l) => l.title || l.url);
 await updateExtendedProfile(userId, {
 extendedDescription: profile.extendedDescription,
 pitchUrl: profile.pitchUrl,
 projectLinks: cleaned,
 collaboratorReferences: profile.collaboratorReferences,
 });
 onSaved({ ...profile, projectLinks: cleaned });
 toast.success("Project links saved.");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not save.");
 } finally {
 setSaving(false);
 }
 };
 return (
 <div>
 <p className="text-sm text-muted-foreground mb-3">
 Anything you&apos;ve shipped or are actively building.
 </p>
 <div className="space-y-2">
 {links.map((link, i) => (
 <div key={i} className="flex gap-2 items-center">
 <input
 type="text"
 value={link.title}
 onChange={(e) => {
 const next = [...links];
 next[i] = { ...link, title: e.target.value };
 setLinks(next);
 }}
 placeholder="Title"
 className="flex-shrink-0 w-1/3 h-10 rounded-sm border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
 />
 <input
 type="url"
 value={link.url}
 onChange={(e) => {
 const next = [...links];
 next[i] = { ...link, url: e.target.value };
 setLinks(next);
 }}
 placeholder="https://..."
 className="flex-1 h-10 rounded-sm border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
 />
 <button
 type="button"
 onClick={() => setLinks(links.filter((_, j) => j !== i))}
 aria-label="Remove link"
 className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 ))}
 <button
 type="button"
 onClick={() => setLinks([...links, { title: "", url: "" }])}
 className="text-[11px] font-mono uppercase tracking-widest text-primary hover:underline mt-2"
 >
 + Add a link
 </button>
 </div>
 <ExtendedSaveButton saving={saving} onClick={handleSave} />
 </div>
 );
};

const ReferencesBody = ({
 profile,
 userId,
 onSaved,
}: {
 profile: Profile;
 userId: string;
 onSaved: (next: Profile) => void;
}) => {
 const [refs, setRefs] = useState(profile.collaboratorReferences);
 const [saving, setSaving] = useState(false);
 useEffect(() => {
 setRefs(profile.collaboratorReferences);
 }, [profile.collaboratorReferences]);
 const handleSave = async () => {
 if (saving) return;
 setSaving(true);
 try {
 const cleaned = refs
 .map((r) => ({
 name: r.name.trim(),
 role: r.role.trim(),
 text: r.text.trim(),
 }))
 .filter((r) => r.name || r.text);
 await updateExtendedProfile(userId, {
 extendedDescription: profile.extendedDescription,
 pitchUrl: profile.pitchUrl,
 projectLinks: profile.projectLinks,
 collaboratorReferences: cleaned,
 });
 onSaved({ ...profile, collaboratorReferences: cleaned });
 toast.success("References saved.");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not save.");
 } finally {
 setSaving(false);
 }
 };
 return (
 <div>
 <p className="text-sm text-muted-foreground mb-3">
 A short quote from a past collaborator builds trust on your
 card.
 </p>
 <div className="space-y-3">
 {refs.map((ref, i) => (
 <div
 key={i}
 className="rounded-sm border border-border bg-background p-3 space-y-2"
 >
 <div className="flex gap-2">
 <input
 type="text"
 value={ref.name}
 onChange={(e) => {
 const next = [...refs];
 next[i] = { ...ref, name: e.target.value };
 setRefs(next);
 }}
 placeholder="Name"
 className="flex-1 h-9 rounded-sm border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
 />
 <input
 type="text"
 value={ref.role}
 onChange={(e) => {
 const next = [...refs];
 next[i] = { ...ref, role: e.target.value };
 setRefs(next);
 }}
 placeholder="Role / relationship"
 className="flex-1 h-9 rounded-sm border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
 />
 <button
 type="button"
 onClick={() => setRefs(refs.filter((_, j) => j !== i))}
 aria-label="Remove reference"
 className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 <textarea
 value={ref.text}
 onChange={(e) => {
 const next = [...refs];
 next[i] = { ...ref, text: e.target.value };
 setRefs(next);
 }}
 rows={2}
 placeholder="What they said about working with you."
 className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
 />
 </div>
 ))}
 <button
 type="button"
 onClick={() => setRefs([...refs, { name: "", role: "", text: "" }])}
 className="text-[11px] font-mono uppercase tracking-widest text-primary hover:underline mt-2"
 >
 + Add a reference
 </button>
 </div>
 <ExtendedSaveButton saving={saving} onClick={handleSave} />
 </div>
 );
};
