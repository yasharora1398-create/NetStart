import { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Hammer,
  Hourglass,
  Linkedin,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Telescope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileCard } from "./ProfileCard";
import { CandidateCard } from "./CandidateCard";
import { ProjectCard } from "./ProjectCard";
import { ApplicationsPanel } from "./ApplicationsPanel";
import type { ProfileSubmission } from "./ProfileCard";
import { getAvatarUrl, listPublishedProjects } from "@/lib/mynet-storage";
import type {
  CandidateProfile,
  Profile,
  Project,
  ProjectCriteria,
  PublicProject,
} from "@/lib/mynet-types";
import { RoleSwitcher, type Role } from "@/components/netstart/RoleSwitcher";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin as MapPinIcon, Briefcase as BriefcaseIcon } from "lucide-react";

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
  /** Toggle the founder's active project (drives Match). */
  onSetActiveProject: (projectId: string | null) => void;
  /** Current role read from auth metadata. */
  role: Role;
  /** Called after the role switch persists; parent refreshes session. */
  onRoleSwitched: (role: Role) => void | Promise<void>;
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
  onSetActiveProject,
  role,
  onRoleSwitched,
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold/40 bg-gold/10 mb-6">
              <Hourglass className="h-3 w-3 text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                Review pending
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10 mb-6">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400">
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
          <ProfileCard profile={profile} onSubmit={onSubmitProfile} />
        ) : (
          <CredentialsDisplay profile={profile} />
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
          when read-only. */}
      <Section
        title="How operators find you"
        eyebrow="02"
        icon={<Telescope className="h-3.5 w-3.5 text-gold" />}
      >
        {editing ? (
          <CandidateCard
            profile={profile}
            onSave={onSaveCandidate}
            onToggleOpenToWork={onToggleOpenToWork}
            onUploadAvatar={onUploadAvatar}
            onRemoveAvatar={onRemoveAvatar}
          />
        ) : (
          <CandidateDisplay profile={profile} />
        )}

        {!editing && profile.candidate.isOpenToWork && (
          <div className="mt-6 block rounded-sm border border-gold-soft/60 bg-gradient-to-r from-gold/5 to-transparent p-6">
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

      {/* For builders: a feed of 5 recently published projects so
          they can browse what's open without leaving MyNet. Hidden
          when the user is in founder mode (they have their own
          projects section instead). */}
      {role === "builder" ? (
        <Section
          title="Projects to consider"
          eyebrow="03"
          icon={<Telescope className="h-3.5 w-3.5 text-gold" />}
        >
          <FeaturedProjects />
        </Section>
      ) : null}

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
            className="w-full rounded-sm border border-dashed border-border hover:border-gold/60 disabled:hover:border-border disabled:cursor-not-allowed disabled:opacity-70 bg-card/40 hover:bg-card disabled:hover:bg-card/40 transition-colors p-8 text-left group"
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
                : "Add what you're building so operators can find and apply to your venture."}
            </p>
            {!isPending && (
              <span className="inline-flex items-center gap-2 text-sm text-gold group-hover:gap-3 transition-all">
                <Plus className="h-4 w-4" />
                Start a project
              </span>
            )}
          </button>
        ) : editing ? (
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
                isActive={profile.activeProjectId === p.id}
                onSetActive={() =>
                  onSetActiveProject(
                    profile.activeProjectId === p.id ? null : p.id,
                  )
                }
              />
            ))}
          </div>
        ) : (
          <ProjectsDisplay
            projects={projects}
            onOpen={onOpenProject}
            onFindPeople={onFindPeople}
            disableFindPeople={isPending}
            activeProjectId={profile.activeProjectId}
            onSetActive={onSetActiveProject}
          />
        )}
      </Section>
      ) : null}

      {/* APPLICATIONS - both panels always shown for the relevant
          role. Builders see their outgoing pitches; founders see
          incoming applications on their projects. */}
      <Section
        title="My applications"
        eyebrow="04"
        icon={<Briefcase className="h-3.5 w-3.5 text-gold" />}
      >
        <ApplicationsPanel ownedProjects={projects} mode="sent" />
      </Section>

      {role === "founder" ? (
        <Section
          title="Applications received"
          eyebrow="05"
          icon={<Briefcase className="h-3.5 w-3.5 text-gold" />}
        >
          <ApplicationsPanel ownedProjects={projects} mode="received" />
        </Section>
      ) : null}
    </>
  );
};

// ===== Display sub-components =====

const Section = ({
  title,
  eyebrow,
  icon,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="mb-12">
    <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2 flex items-center gap-2">
          {icon}
          <span>
            {eyebrow} · {title}
          </span>
        </p>
        <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </section>
);

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

const CredentialsDisplay = ({ profile }: { profile: Profile }) => (
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
          <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
        </a>
      ) : (
        <span className="text-muted-foreground">Not added</span>
      )}
    </InfoRow>

    <InfoRow label="Resume">
      {profile.resume ? (
        <div className="inline-flex items-center gap-3">
          <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-gold" />
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
            className="h-20 w-20 rounded-sm object-cover border border-gold/40 flex-shrink-0"
          />
        ) : (
          <div className="h-20 w-20 rounded-sm bg-gold/10 border border-gold/40 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl text-gold">
              {initials(profile.fullName)}
            </span>
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
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
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
                className="px-2.5 py-1 text-xs rounded-sm border border-gold/30 bg-gold/5"
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

const ProjectsDisplay = ({
  projects,
  onOpen,
  onFindPeople,
  disableFindPeople = false,
  activeProjectId,
  onSetActive,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  onFindPeople: (id: string) => void;
  disableFindPeople?: boolean;
  activeProjectId?: string | null;
  onSetActive?: (projectId: string | null) => void;
}) => (
  <div className="grid md:grid-cols-2 gap-4">
    {projects.map((p) => {
      const isActive = activeProjectId === p.id;
      return (
        <article
          key={p.id}
          className={`rounded-sm border bg-card p-6 transition-colors ${
            isActive
              ? "border-gold/70 ring-1 ring-gold/30"
              : "border-border hover:border-gold/40"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-display text-2xl leading-tight truncate flex-1">
              {p.title}
            </h3>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-gold/60 bg-gold/15 text-[10px] font-mono uppercase tracking-widest text-gold">
                  <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                  Match focus
                </span>
              ) : null}
              <span
                className={`px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest ${
                  p.isPublished
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {p.isPublished ? "Public" : "Draft"}
              </span>
            </div>
          </div>

          {p.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
              {p.description}
            </p>
          )}

          <ProjectCriteriaPreview criteria={p.criteria} />

          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {p.savedPersonIds.length} saved
            </span>
            <div className="flex items-center gap-2">
              {onSetActive ? (
                <Button
                  variant={isActive ? "gold" : "ghost"}
                  size="sm"
                  onClick={() => onSetActive(isActive ? null : p.id)}
                  title={
                    isActive
                      ? "Clear Match focus"
                      : "Use this project for Match"
                  }
                >
                  <Star
                    className={`h-4 w-4 ${isActive ? "fill-current" : ""}`}
                  />
                  {isActive ? "Focus" : "Use for Match"}
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpen(p.id)}
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                variant="outlineGold"
                size="sm"
                onClick={() => onFindPeople(p.id)}
                disabled={disableFindPeople}
                title={
                  disableFindPeople
                    ? "Available once your review is approved."
                    : undefined
                }
              >
                <Search className="h-4 w-4" />
                Find people
              </Button>
            </div>
          </div>
        </article>
      );
    })}
  </div>
);

const ProjectCriteriaPreview = ({
  criteria,
}: {
  criteria: ProjectCriteria;
}) => {
  const { skills, commitment, location } = criteria;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
      {commitment && (
        <span className="inline-flex items-center gap-1.5">
          <Briefcase className="h-3 w-3 text-gold" />
          {commitment}
        </span>
      )}
      {location && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-gold" />
          {location}
        </span>
      )}
      {skills.slice(0, 3).map((s) => (
        <span
          key={s}
          className="px-1.5 py-0.5 rounded-sm border border-gold/30 bg-gold/5 normal-case tracking-normal text-foreground/80"
        >
          {s}
        </span>
      ))}
      {skills.length > 3 && (
        <span className="text-muted-foreground/60">+{skills.length - 3}</span>
      )}
    </div>
  );
};

// Builder-only feed of up to five recently published projects so a
// builder lands on MyNet and immediately sees what's open. Each card
// links into /talent so they can apply or browse from there.
const FeaturedProjects = () => {
  const [items, setItems] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listPublishedProjects()
      .then((rows) => {
        if (!cancelled) setItems(rows.slice(0, 5));
      })
      .catch(() => {
        // soft-fail; empty state renders below
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-sm border border-border bg-card/40 p-8 text-sm text-muted-foreground">
        Loading projects...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card/40 p-8 text-center">
        <h3 className="font-display text-xl mb-2">No projects yet.</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Founders are still spinning things up. Check back soon, or open
          Talents to browse everything.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((p) => (
        <FeaturedProjectCard key={p.id} project={p} />
      ))}
      <Link
        to="/talent"
        className="rounded-sm border border-dashed border-border bg-card/40 p-6 hover:border-gold/40 hover:bg-card transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-gold"
      >
        Browse all projects
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

const FeaturedProjectCard = ({ project }: { project: PublicProject }) => {
  const founderUrl = getAvatarUrl(project.founderAvatarPath);
  return (
    <Link
      to={`/match`}
      className="group block rounded-sm border border-border bg-card hover:border-gold/40 transition-colors p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display text-xl leading-tight truncate flex-1 group-hover:text-gold transition-colors">
          {project.title}
        </h3>
        {project.businessType ? (
          <span className="px-2 py-1 rounded-sm border border-gold/30 bg-gold/5 text-[10px] font-mono uppercase tracking-widest text-gold flex-shrink-0">
            {project.businessType}
          </span>
        ) : null}
      </div>

      {(project.founderFullName || project.founderHeadline) ? (
        <div className="flex items-center gap-2 mb-4">
          {founderUrl ? (
            <img
              src={founderUrl}
              alt={project.founderFullName}
              className="h-7 w-7 rounded-sm object-cover border border-gold/30"
              loading="lazy"
            />
          ) : (
            <div className="h-7 w-7 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center font-display text-[10px] text-gold">
              {(project.founderFullName[0] ?? "?").toUpperCase()}
            </div>
          )}
          <span className="text-xs text-muted-foreground truncate">
            <span className="text-foreground">
              {project.founderFullName || "Anonymous"}
            </span>
            {project.founderHeadline ? ` · ${project.founderHeadline}` : null}
          </span>
        </div>
      ) : null}

      {project.description ? (
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
          {project.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {project.criteria.commitment ? (
          <span className="inline-flex items-center gap-1.5">
            <BriefcaseIcon className="h-3 w-3 text-gold" />
            {project.criteria.commitment}
          </span>
        ) : null}
        {project.criteria.location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="h-3 w-3 text-gold" />
            {project.criteria.location}
          </span>
        ) : null}
        {project.criteria.skills.slice(0, 2).map((s) => (
          <span key={s} className="text-[11px] normal-case tracking-normal text-muted-foreground">
            {s}
          </span>
        ))}
      </div>
    </Link>
  );
};

// Renders the user's profile / project the way the OTHER side of
// the network sees it on Match. Builders see their own candidate
// card (what founders flip through); founders see their active
// project card (what builders see). Helps the user catch missing
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
  if (role === "builder") {
    return <CandidatePreviewCard profile={profile} />;
  }
  // Founder POV: prefer the active project, fall back to the first.
  const active =
    projects.find((p) => p.id === profile.activeProjectId) ?? projects[0];
  if (!active) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card/40 p-8 text-center">
        <h3 className="font-display text-xl mb-2">No project to preview</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Post a project below and it'll appear here as builders will see it
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
    <article className="mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-gold-soft bg-card shadow-sm">
      <div className="relative w-full aspect-square bg-gold/5">
        {url ? (
          <img
            src={url}
            alt={profile.fullName}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl text-gold/60">
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
          <p className="mb-2 text-sm font-medium text-foreground/90">
            {c.headline}
          </p>
        ) : null}
        {c.bio ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {c.bio}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground/60">
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
    <article className="mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-gold-soft bg-card shadow-sm">
      <div className="relative w-full aspect-square bg-gold/5">
        {url ? (
          <img
            src={url}
            alt={profile.fullName}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl text-gold/60">
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
          <p className="text-sm italic text-muted-foreground/60">
            No description yet. Builders see a blank pitch here.
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
        ? "rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
        : "inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold"
    }
  >
    {children}
  </span>
);
