/**
 * Sign-out confirmation for the mobile app. Wraps React Native's
 * Alert.alert with consistent copy + button order so every place we
 * sign people out (MyNet, Settings, the review-status overlay)
 * shares the same prompt.
 *
 * The destructive role is on "Sign out" so iOS surfaces it in red
 * and Android applies the destructive theme. Cancel is the default
 * action so a stray dismiss leaves the session intact.
 */
import { Alert } from "react-native";

type Scope = "local" | "global";

export const confirmSignOut = (
  signOut: (scope?: Scope) => Promise<void> | void,
  scope: Scope = "global",
): void => {
  Alert.alert(
    "Sign out?",
    scope === "local"
      ? "You'll be signed out of this device. Other devices stay signed in. You can sign back in any time with your email and password."
      : "You'll be signed out everywhere. You can sign back in any time with your email and password.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut(scope);
        },
      },
    ],
  );
};
