/**
 * Sign-out confirmation for the mobile app.
 *
 * Two scopes:
 * "local" — sign out of this device only. Other devices stay
 * signed in. This is the default; it's what the casual
 * "Sign out" button at the bottom of MyNet does, and
 * what the locked-review overlay's escape hatch does.
 * "global" — sign out of every device. Reserved for the explicit
 * "Sign out everywhere" action in Settings, used when
 * the user thinks their account may be compromised.
 *
 * Native iOS / Android use Alert.alert. Web (polln8.com/m) falls
 * back to window.confirm because react-native-web's Alert.alert
 * polyfill silently drops the buttons on multi-button alerts —
 * meaning the destructive onPress never fires.
 */
import { Alert, Platform } from "react-native";

type Scope = "local" | "global";

const message = (scope: Scope): string =>
 scope === "local"
 ? "You'll be signed out of this device. Other devices stay signed in. You can sign back in any time with your email and password."
 : "You'll be signed out everywhere. You can sign back in any time with your email and password.";

const title = (scope: Scope): string =>
 scope === "local" ? "Sign out of this device?" : "Sign out everywhere?";

const confirmLabel = (scope: Scope): string =>
 scope === "local" ? "Sign out" : "Sign out everywhere";

export const confirmSignOut = (
 signOut: (scope?: Scope) => Promise<void> | void,
 scope: Scope = "local",
): void => {
 if (Platform.OS === "web") {
 const ok =
 typeof window !== "undefined" &&
 typeof window.confirm === "function" &&
 window.confirm(`${title(scope)}\n\n${message(scope)}`);
 if (ok) void signOut(scope);
 return;
 }

 Alert.alert(title(scope), message(scope), [
 { text: "Cancel", style: "cancel" },
 {
 text: confirmLabel(scope),
 style: "destructive",
 onPress: () => {
 void signOut(scope);
 },
 },
 ]);
};
