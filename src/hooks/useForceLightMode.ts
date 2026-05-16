"use client";
/**
 * Strip the `.dark` class off <html> while a component is mounted.
 * Used by the unauthenticated landing surfaces (welcome, sign-in,
 * sign-up, password reset) so they always render in the light
 * design palette regardless of the user's saved theme preference.
 *
 * Restores the previous .dark state on unmount so the rest of the
 * authenticated app continues to respect the user's pick.
 */
import { useEffect } from "react";

export const useForceLightMode = (): void => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    if (hadDark) root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
    };
  }, []);
};
