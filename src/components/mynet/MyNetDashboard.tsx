import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Hammer,
  Linkedin,
  MapPin,
  Pencil,
  Plus,
  Search,
  Telescope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileCard } from "./ProfileCard";
import { CandidateCard } from "./CandidateCard";
import { ProjectCard } from "./ProjectCard";
import { ApplicationsPanel } from "./ApplicationsPanel";
import type { ProfileSubmission } from "./ProfileCard";
import { getAvatarUrl } from "@/lib/mynet-storage";
import type {
  CandidateProfile,
  Profile,
  Project,
  ProjectCriteria,
} from "@/lib/mynet-types";

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
}: Props) => {
  const [editing, setEditing] = useState(false);

  const hasCandidate =
    profile.candidate.headline.trim() !== "" ||
    profile.candidate.bio.trim() !== "" ||
    profile.candidate.skills.length > 0;
  const hasProjects = projects.length > 0;

  return (
    <>
      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10 mb-6">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400">
            Accepted
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] mb-3">
          Your <em className="text-gradient-gold not-italic">profile.</em>
        </h1>
        <p className="text-muted-foreground max-w-xl">
          {editing
            ? "Editing. Make your changes and click Done."
            : "Everything you've set up, at a glance."}
        </p>
      </header>

      {/* CREDENTIALS */}
      <Section title="Credentials" eyebrow="01">
        {editing ? (
          <ProfileCard profile={profile} onSubmit={onSubmitProfile} />
        ) : (
          <CredentialsDisplay profile={profile} />
        )}
      </Section>

      {/* LOOKING — only if they signed up as a looker */}
      {hasCandidate && (
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
            <Link
              to="/talent"
              className="mt-6 block rounded-sm border border-gold-soft bg-gradient-to-r from-gold/10 to-transparent p-6 hover:border-gold/60 transition-colors group"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1">
                    Find projects
                  </p>
                  <h3 className="font-display text-2xl mb-1">
                    Browse open projects
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ranked against your profile.
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-gold group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </Link>
          )}
        </Section>
      )}

      {/* BUILDING — only if they have projects */}
      {hasProjects && (
        <Section
          title="What you're building"
          eyebrow="03"
          icon={<Hammer className="h-3.5 w-3.5 text-gold" />}
          action={
            editing ? (
              <Button variant="gold" size="lg" onClick={onNewProject}>
                <Plus className="h-4 w-4" />
                New project
              </Button>
            ) : null
          }
        >
          {editing ? (
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
                />
              ))}
            </div>
          ) : (
            <ProjectsDisplay
              projects={projects}
              onOpen={onOpenProject}
              onFindPeople={onFindPeople}
            />
          )}
        </Section>
      )}

      {/* APPLICATIONS */}
      {hasCandidate && (
        <Section
          title="My applications"
          eyebrow="04"
          icon={<Briefcase className="h-3.5 w-3.5 text-gold" />}
        >
          <ApplicationsPanel ownedProjects={projects} mode="sent" />
        </Section>
      )}

      {hasProjects && (
        <Section
          title="Applications received"
          eyebrow={hasCandidate ? "05" : "04"}
          icon={<Briefcase className="h-3.5 w-3.5 text-gold" />}
        >
          <ApplicationsPanel ownedProjects={projects} mode="received" />
        </Section>
      )}

      {/* EDIT / DONE TOGGLE */}
      <div className="flex justify-end pt-8 mt-8 border-t border-border">
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
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  onFindPeople: (id: string) => void;
}) => (
  <div className="grid md:grid-cols-2 gap-4">
    {projects.map((p) => (
      <article
        key={p.id}
        className="rounded-sm border border-border bg-card p-6 hover:border-gold/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-display text-2xl leading-tight truncate flex-1">
            {p.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest flex-shrink-0 ${
              p.isPublished
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {p.isPublished ? "Public" : "Draft"}
          </span>
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
            >
              <Search className="h-4 w-4" />
              Find people
            </Button>
          </div>
        </div>
      </article>
    ))}
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
