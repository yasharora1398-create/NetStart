import { LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

const initials = (name: string | undefined, email: string | undefined) => {
  const source = (name?.trim() || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const name = (user.user_metadata?.name as string | undefined) ?? undefined;
  const email = user.email ?? undefined;
  const label = name ?? email ?? "Account";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out.");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className="flex items-center gap-2 rounded-sm border border-gold-soft bg-gold/5 hover:bg-gold/10 transition-colors px-3 h-9"
      >
        <span className="h-6 w-6 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-[10px] font-mono text-gold">
          {initials(name, email)}
        </span>
        <span className="hidden sm:block text-sm text-foreground max-w-[140px] truncate">
          {label}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            {name && <span className="text-sm text-foreground">{name}</span>}
            {email && <span className="text-xs text-muted-foreground truncate">{email}</span>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
