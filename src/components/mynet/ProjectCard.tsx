import { ArrowRight, CheckCircle, Eye, EyeOff, MoreVertical, Pause, Pencil, Search, Star, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, ProjectLifecycle } from "@/lib/mynet-types";
import { hasAnyCriteria } from "@/lib/matching";

type ProjectCardProps = {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onFindPeople: () => void;
  onOpen: () => void;
  onTogglePublish: () => void;
  onSetLifecycle: (state: ProjectLifecycle) => void;
  /** Is this the founder's currently-active project? */
  isActive?: boolean;
  /** Mark this project as the one driving Match. Pass null-clear via the same handler. */
  onSetActive?: () => void;
};

const lifecycleLabel = (s: ProjectLifecycle): string =>
  s === "active"
    ? "Active"
    : s === "paused"
      ? "Paused"
      : s === "filled"
        ? "Filled"
        : "Closed";

export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  onFindPeople,
  onOpen,
  onTogglePublish,
  onSetLifecycle,
  isActive,
  onSetActive,
}: ProjectCardProps) => {
  const savedCount = project.savedPersonIds.length;
  const criteriaSet = hasAnyCriteria(project.criteria);
  const lifecycle = project.lifecycleState;

  return (
    <div
      className={`group relative rounded-sm border bg-card transition-all overflow-hidden ${
        isActive
          ? "border-gold/70 ring-1 ring-gold/30"
          : "border-border hover:border-gold/40"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <button
            onClick={onOpen}
            className="text-left flex-1 min-w-0"
            aria-label={`Open ${project.title}`}
          >
            <h3 className="font-display text-2xl leading-tight group-hover:text-gold transition-colors truncate">
              {project.title}
            </h3>
          </button>

          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            {isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-gold/60 bg-gold/15 text-[10px] font-mono uppercase tracking-widest text-gold">
                <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                Match focus
              </span>
            ) : null}
            <span
              className={`px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest ${
                project.isPublished
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {project.isPublished ? "Public" : "Draft"}
            </span>
            {lifecycle !== "active" ? (
              <span className="px-2 py-1 rounded-sm border border-gold/40 bg-gold/10 text-[10px] font-mono uppercase tracking-widest text-gold">
                {lifecycleLabel(lifecycle)}
              </span>
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors flex-shrink-0"
                aria-label="Project menu"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePublish}>
                {project.isPublished ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Publish to builders
                  </>
                )}
              </DropdownMenuItem>
              {onSetActive ? (
                <DropdownMenuItem onClick={onSetActive}>
                  <Star
                    className={`h-4 w-4 ${isActive ? "fill-gold text-gold" : ""}`}
                  />
                  {isActive ? "Clear Match focus" : "Use for Match"}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Lifecycle
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onSetLifecycle("active")}
                disabled={lifecycle === "active"}
              >
                <CheckCircle className="h-4 w-4" />
                Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSetLifecycle("paused")}
                disabled={lifecycle === "paused"}
              >
                <Pause className="h-4 w-4" />
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSetLifecycle("filled")}
                disabled={lifecycle === "filled"}
              >
                <CheckCircle className="h-4 w-4" />
                Filled
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSetLifecycle("closed")}
                disabled={lifecycle === "closed"}
              >
                <X className="h-4 w-4" />
                Closed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 min-h-[28px] mb-5">
          {project.criteria.skills.length > 0 ? (
            project.criteria.skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 text-[11px] rounded-sm border border-gold/30 bg-gold/5 text-foreground"
              >
                {s}
              </span>
            ))
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              No skill criteria yet
            </span>
          )}
          {project.criteria.skills.length > 5 && (
            <span className="text-[11px] text-muted-foreground self-center">
              +{project.criteria.skills.length - 5}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-gold" />
            <span>
              <span className="text-gold">{savedCount}</span> saved
            </span>
          </div>

          <Button
            variant={criteriaSet ? "gold" : "outlineGold"}
            size="sm"
            onClick={onFindPeople}
          >
            <Search className="h-4 w-4" />
            Find people
          </Button>
        </div>
      </div>

      {savedCount > 0 && (
        <button
          type="button"
          onClick={onOpen}
          className="relative w-full px-6 py-3 border-t border-border bg-background/40 hover:bg-gold/5 transition-colors flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-gold"
          aria-label={`View ${savedCount} saved profiles`}
        >
          <span className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-gold" />
            View saved profiles
            <span className="text-foreground/80 normal-case tracking-normal">
              ({savedCount})
            </span>
          </span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
