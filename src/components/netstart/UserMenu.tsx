import { LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { Link } from "@/lib/router-compat";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useConfirmSignOut } from "@/components/netstart/SignOutConfirm";

const initials = (name: string | undefined, email: string | undefined) => {
 const source = (name?.trim() || email || "?").trim();
 const parts = source.split(/\s+/).filter(Boolean);
 if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
 return source.slice(0, 2).toUpperCase();
};

export const UserMenu = () => {
 const { user } = useAuth();
 const confirmSignOut = useConfirmSignOut();
 if (!user) return null;

 const name = (user.user_metadata?.name as string | undefined) ?? undefined;
 const email = user.email ?? undefined;
 const label = name ?? email ?? "Account";

 // Routed through the shared confirm dialog so a misclick on the
 // dropdown doesn't end the session. The dialog handles toast +
 // post-signout navigation.
 const handleSignOut = () => confirmSignOut();

 return (
 <DropdownMenu>
 <DropdownMenuTrigger
 aria-label="Open account menu"
 className="flex items-center gap-2 rounded-sm border border-gold bg-gold hover:bg-gold transition-colors px-3 h-9"
 >
 <span className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center"><User className="h-3 w-3 text-muted-foreground" /></span>
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
 <DropdownMenuItem asChild className="cursor-pointer">
 <Link to={`/u/${user.id}`}>
 <User className="mr-2 h-4 w-4" />
 View public profile
 </Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild className="cursor-pointer">
 <Link to="/app/settings">
 <SettingsIcon className="mr-2 h-4 w-4" />
 Settings
 </Link>
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
 <LogOut className="mr-2 h-4 w-4" />
 Sign out
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 );
};
