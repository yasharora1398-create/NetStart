/**
 * Generic two-button confirm dialog that works on every platform.
 *
 * Native iOS / Android: real `Alert.alert` with destructive-style
 * button when `destructive: true`. Cancel is default.
 * Web (polln8.com/m, react-native-web): falls back to
 * `window.confirm`. RNW's Alert.alert polyfill silently no-ops on
 * multi-button alerts - only the title gets rendered, the buttons
 * drop, and the destructive `onPress` never fires. This wrapper
 * ensures every confirm/destroy flow actually works on web too.
 *
 * Use this instead of `Alert.alert(title, msg, [{...},{...}])`.
 */
import { Alert, Platform } from "react-native";

type ConfirmOpts = {
 title: string;
 message?: string;
 confirmLabel?: string;
 cancelLabel?: string;
 destructive?: boolean;
 onConfirm: () => void;
 onCancel?: () => void;
};

export const confirm = ({
 title,
 message,
 confirmLabel = "OK",
 cancelLabel = "Cancel",
 destructive = false,
 onConfirm,
 onCancel,
}: ConfirmOpts): void => {
 if (Platform.OS === "web") {
 const ok =
 typeof window !== "undefined" &&
 typeof window.confirm === "function" &&
 window.confirm(message ? `${title}\n\n${message}` : title);
 if (ok) onConfirm();
 else onCancel?.();
 return;
 }

 Alert.alert(title, message, [
 {
 text: cancelLabel,
 style: "cancel",
 onPress: () => onCancel?.(),
 },
 {
 text: confirmLabel,
 style: destructive ? "destructive" : "default",
 onPress: onConfirm,
 },
 ]);
};
