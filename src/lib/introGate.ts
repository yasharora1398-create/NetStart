/**
 * Shared "intro gate" persistence. Each tab/cover/title page on Profile,
 * Match, Chats, and Saved used to render its explainer screen on every
 * visit; per-tab sessionStorage made it once-per-tab. The user wanted
 * it once-per-DEVICE - so the dismissal is now stored in localStorage,
 * which survives reloads, page swaps, and new tabs alike.
 *
 * Each surface picks its own key via the IntroSurface union so flipping
 * one doesn't dismiss the others.
 */

export type IntroSurface = "match" | "mynet" | "chats" | "saved";

const KEY_PREFIX = "polln8.intro.opened.v1.";

const keyFor = (surface: IntroSurface): string => `${KEY_PREFIX}${surface}`;

export const readIntroOpened = (surface: IntroSurface): boolean => {
 if (typeof window === "undefined") return false;
 try {
 return window.localStorage.getItem(keyFor(surface)) === "1";
 } catch {
 return false;
 }
};

export const writeIntroOpened = (
 surface: IntroSurface,
 value: boolean,
): void => {
 if (typeof window === "undefined") return;
 try {
 if (value) window.localStorage.setItem(keyFor(surface), "1");
 else window.localStorage.removeItem(keyFor(surface));
 } catch {
 // storage disabled / quota - non-fatal; the user will see the
 // gate on the next mount and can dismiss again.
 }
};
