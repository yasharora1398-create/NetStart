/**
 * Single app-wide confirm-and-signout dialog. Living at the root
 * means every sign-out button on the site (sidebar, user menu,
 * settings, waitlist nav) routes through the same modal instead of
 * each component shipping its own copy.
 *
 *   <SignOutConfirmProvider>
 *     {app}
 *   </SignOutConfirmProvider>
 *
 *   const confirm = useConfirmSignOut();
 *   <button onClick={() => confirm()}>Sign out</button>
 *
 * The dialog presents two choices each time:
 *   - "Sign out on this tab"  → Supabase scope "local"
 *   - "Sign out everywhere"   → Supabase scope "global"
 *
 * The casual click loses just this session; the "everywhere" button
 * is reserved for the compromised-account flow. Callers don't
 * choose a scope - the user does at the moment of confirmation.
 *
 * Note on "this tab": Supabase auth state is shared across all tabs
 * of the same browser via localStorage, so a "local" sign-out will
 * sign every tab of *this* browser out (not just the one the user
 * clicked from). Different browsers or different devices stay
 * signed in. The label trades technical accuracy for the user's
 * actual mental model.
 */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@/lib/router-compat";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

type Scope = "tab" | "global";

type ConfirmFn = () => void;

const SignOutConfirmContext = createContext<ConfirmFn | null>(null);

export const SignOutConfirmProvider = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<Scope | null>(null);

  const confirm: ConfirmFn = useCallback(() => {
    setOpen(true);
  }, []);

  const handleSignOut = async (scope: Scope) => {
    if (working) return;
    setWorking(scope);
    try {
      await signOut(scope);
      setOpen(false);
      // Land on the homepage so the just-signed-out user doesn't
      // sit on a now-blurred private route. `replace` so the back
      // button doesn't bring them right back.
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not sign out.",
      );
    } finally {
      setWorking(null);
    }
  };

  const busy = working !== null;

  return (
    <SignOutConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          // Block close while the request is in flight so the user
          // can't accidentally dismiss mid-signout.
          if (!busy) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Pick one. Sign out of this tab and the rest of your devices
              stay signed in. Sign out everywhere if you think someone else
              has access to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col sm:gap-2 sm:items-stretch">
            <Button
              variant="gold"
              onClick={() => void handleSignOut("tab")}
              disabled={busy}
              className="gap-2 w-full justify-center"
            >
              {working === "tab" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {working === "tab" ? "Signing out..." : "Sign out on this tab"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleSignOut("global")}
              disabled={busy}
              className="gap-2 w-full justify-center"
            >
              {working === "global" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {working === "global" ? "Signing out..." : "Sign out everywhere"}
            </Button>
            <AlertDialogCancel disabled={busy} className="w-full sm:mt-0">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SignOutConfirmContext.Provider>
  );
};

export const useConfirmSignOut = (): ConfirmFn => {
  const ctx = useContext(SignOutConfirmContext);
  if (!ctx) {
    throw new Error(
      "useConfirmSignOut must be called inside SignOutConfirmProvider",
    );
  }
  return ctx;
};
