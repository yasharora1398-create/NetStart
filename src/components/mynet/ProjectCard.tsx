import { Eye, EyeOff, MoreVertical, Pencil, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/mynet-types";
import { hasAnyCriteria } from "@/lib/matching";

type ProjectCardProps = {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onFindPeople: () => void;
  onOpen: () => void;
  onTogglePublish: () => void;
};

export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  onFindPeople,
  onOpen,
  onTogglePublish,
}: ProjectCardProps) => {
  const savedCount = project.savedPersonIds.length;
  const criteriaSet = hasAnyCriteria(project.criteria);

  return (
    <div className="group relative rounded-sm border border-border bg-card hover:border-gold/40 transition-all overflow-hidden">
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

          <span
            className={`px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest flex-shrink-0 ${
              project.isPublished
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {project.isPublished ? "Public" : "Draft"}
          </span>

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
                    Publish to talent
                  </>
                )}
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
    </div>
  );
};
