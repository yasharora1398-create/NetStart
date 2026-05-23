/**
 * Tiny helpers for opening external links from RN code. The big
 * reason this exists: `Linking.openURL("linkedin.com/in/foo")` is
 * rejected on iOS and Android because the URL has no scheme, while
 * the app accepts and stores LinkedIn URLs both with and without
 * the leading `https://`. Centralizing the normalize so every call
 * site behaves the same.
 *
 * Also web-safe: `Alert.alert` here is single-button, which the
 * react-native-web polyfill renders correctly via `window.alert`.
 */
import { Alert, Linking } from "react-native";

const withScheme = (raw: string): string =>
 /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

export const openLinkedIn = (raw: string | null | undefined): void => {
 const trimmed = raw?.trim();
 if (!trimmed) return;
 const url = withScheme(trimmed);
 Linking.openURL(url).catch(() => Alert.alert("Couldn't open", url));
};

export const openWebsite = (raw: string | null | undefined): void => {
 const trimmed = raw?.trim();
 if (!trimmed) return;
 const url = withScheme(trimmed);
 Linking.openURL(url).catch(() => Alert.alert("Couldn't open", url));
};
