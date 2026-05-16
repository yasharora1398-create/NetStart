/**
 * Role switcher for the MyNet page. Two-segment toggle (Founder /
 * Builder); clicking the *other* role opens a confirmation dialog
 * before committing the change. The change goes through
 * `setRole`, which writes to `user_metadata.role` on the auth user.
 *
 * Switching never touches the profile row — a builder's headline,
 * bio, skills, location, etc. all survive a trip through founder and
 * come back exactly as they were when the user switches back.
 */
import { useState } from "react";
import { Hammer, Loader2, Telescope } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { setRole } from "@/lib/mynet-storage";
import { cn } from "@/lib/utils";

export type Role = "founder" | "builder";

type Props = {
  currentRole: Role;
  /**
   * Called after the role write has succeeded. Parent typically
   * refreshes the auth session + reloads profile/projects so the
   * dashboard reflects the new mode.
   */
  onSwitched: (role: Role) => void | Promise<void>;
};

export const RoleSwitcher = ({ currentRole, onSwitched }: Props) => {
  const [pending, setPending] = useState<Role | null>(null);
  const [working, setWorking] = useState(false);

  const handleConfirm = async () => {
    if (!pending || working) return;
    setWorking(true);
    try {
      await setRole(pending);
      toast.success(
        pending === "founder" ? "Switched to Founder." : "Switched to Builder.",
      );
      const next = pending;
      setPending(null);
      await onSwitched(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
        <RoleButton
          label="Builder"
          icon={<Telescope className="h-3.5 w-3.5" />}
          active={currentRole === "builder"}
          onClick={() => {
            if (currentRole !== "builder") setPending("builder");
          }}
        />
        <RoleButton
          label="Founder"
          icon={<Hammer className="h-3.5 w-3.5" />}
          active={currentRole === "founder"}
          onClick={() => {
            if (currentRole !== "founder") setPending("founder");
          }}
        />
      </div>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !working) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pending === "founder" ? "Founder" : "Builder"} mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending === "founder" ? (
                <>
                  You'll see the founder dashboard: post projects, review
                  applications, and search for builders. Your builder profile
                  (headline, bio, skills, resume) stays exactly where you left
                  it — switching back later restores all of it untouched.
                </>
              ) : (
                <>
                  You'll go back to being matched as an builder. Your existing
                  projects stay where they are (still published unless you
                  unpublish them); switching to Founder later puts you right
                  back on top of them.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Stop the dialog from auto-closing on click — we need
                // the spinner to show until setRole actually resolves.
                e.preventDefault();
                void handleConfirm();
              }}
              disabled={working}
              className="gap-2"
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Switch to {pending === "founder" ? "Founder" : "Builder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const RoleButton = ({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors",
      active
        ? "bg-gold text-gold-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {icon}
    {label}
  </button>
);
