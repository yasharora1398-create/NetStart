import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { builderById } from "@/lib/builders";
import type { Project } from "@/lib/mynet-types";

type SavedPeopleListProps = {
  project: Project;
  onUnsave: (personId: string) => void;
};

export const SavedPeopleList = ({ project, onUnsave }: SavedPeopleListProps) => {
  const people = project.savedPersonIds
    .map((id) => builderById(id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  if (people.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card/40 p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
          Empty
        </p>
        <p className="text-sm text-muted-foreground">
          Tap Find people on this project to start saving matches.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {people.map((b) => (
        <article
          key={b.id}
          className="rounded-sm border border-border bg-card hover:border-gold/40 transition-colors overflow-hidden"
        >
          <div className="flex gap-4 p-5">
            <img
              src={b.image}
              alt={b.name}
              className="h-16 w-16 object-cover rounded-sm flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-lg leading-tight truncate">
                {b.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">{b.role}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1">
                {b.location}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnsave(b.id)}
              aria-label={`Remove ${b.name}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};
