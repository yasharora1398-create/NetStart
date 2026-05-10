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
 * Pass `confirm("local")` to sign out only the current device. The
 * dialog text adapts so the user knows which is happening.
 */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";

type Scope = "local" | "global";

type ConfirmFn = (scope?: Scope) => void;

const SignOutConfirmContext = createContext<ConfirmFn | null>(null);

export const SignOutConfirmProvider = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("global");
  const [working, setWorking] = useState(false);

  const confirm: ConfirmFn = useCallback((next = "global") => {
    setScope(next);
    setOpen(true);
  }, []);

  const handleSignOut = async () => {
    if (working) return;
    setWorking(true);
    try {
      await signOut(scope);
      setOpen(false);
      // Land on the homepage so the just-signed-out user doesn't sit
      // on a now-blurred private route. `replace` so back-button
      // doesn't bring them right back.
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not sign out.",
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <SignOutConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          // Block close while the request is in flight so the user
          // can't accidentally dismiss mid-signout.
          if (!working) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              {scope === "local"
                ? "You'll be signed out of this device. Other devices stay signed in. You can sign back in any time with your email and password."
                : "You'll be signed out everywhere — this device and any others you're signed in on. You can sign back in any time with your email and password."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Stop the dialog auto-closing — we want the spinner
                // to ride until the request resolves.
                e.preventDefault();
                void handleSignOut();
              }}
              disabled={working}
              className="gap-2"
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {working ? "Signing out..." : "Sign out"}
            </AlertDialogAction>
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
