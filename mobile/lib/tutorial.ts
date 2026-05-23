// Shared tutorial state for the Match tab. Stored as a single
// AsyncStorage key. Bump the suffix when you want every existing user
// to see the latest tutorial copy/layout again.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TUTORIAL_KEY = "netstart_tutorial_seen_match_v2";

export const resetTutorial = (): Promise<void> =>
 AsyncStorage.removeItem(TUTORIAL_KEY).catch(() => undefined) as Promise<void>;

// Module-scoped one-shot flag for "the user just tapped Tutorial in MyNet,
// force the overlay on next Match focus." Avoids relying on URL params
// which don't always re-fire across tab navigation.
let pendingReplay = false;
export const triggerTutorialReplay = (): void => {
 pendingReplay = true;
};
export const consumePendingReplay = (): boolean => {
 const v = pendingReplay;
 pendingReplay = false;
 return v;
};
