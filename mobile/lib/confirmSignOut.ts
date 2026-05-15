/**
 * Sign-out confirmation for the mobile app. Native iOS / Android
 * use React Native's Alert.alert so the user sees the proper system
 * dialog with destructive-red "Sign out" and a Cancel default.
 *
 * Web is a different story: react-native-web's Alert.alert polyfill
 * silently no-ops on multi-button alerts (it only renders the title
 * via window.alert and drops the buttons). That meant the Sign-out
 * button on polln8.com/m did literally nothing -- the confirmation
 * dialog never appeared, and so the onPress that would actually
 * call signOut() never fired. Fallback to window.confirm() on web
 * so the flow works there too.
 */
import { Alert, Platform } from "react-native";

type Scope = "local" | "global";

const message = (scope: Scope): string =>
  scope === "local"
    ? "You'll be signed out of this device. Other devices stay signed in. You can sign back in any time with your email and password."
    : "You'll be signed out everywhere. You can sign back in any time with your email and password.";

export const confirmSignOut = (
  signOut: (scope?: Scope) => Promise<void> | void,
  scope: Scope = "global",
): void => {
  if (Platform.OS === "web") {
    // Synchronous confirm() blocks the UI thread until the user
    // answers, which on web is the same modal-like behavior we'd
    // get from Alert.alert on native. If confirm returns true,
    // proceed; otherwise the session stays intact.
    const ok =
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      window.confirm(`Sign out?\n\n${message(scope)}`);
    if (ok) void signOut(scope);
    return;
  }

  Alert.alert("Sign out?", message(scope), [
    { text: "Cancel", style: "cancel" },
    {
      text: "Sign out",
      style: "destructive",
      onPress: () => {
        void signOut(scope);
      },
    },
  ]);
};
