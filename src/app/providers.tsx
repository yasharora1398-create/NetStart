"use client";

/**
 * Client-side providers for the entire app. Replaces the giant
 * provider stack that used to live inside src/App.tsx under Vite.
 *
 * Everything here runs on the client because every provider listens
 * to browser-only state -- React Query cache, Supabase auth, theme
 * preference, sidebar collapse, etc. Mounting them server-side would
 * either crash or produce hydration mismatches.
 *
 * Mounting strategy:
 *   - One QueryClient per browser session (useState lazy init so a
 *     React strict-mode re-render doesn't reset the cache).
 *   - Toaster + Sonner mount once at this layer so any page can call
 *     toast() without re-providing.
 *   - EmailVerifyBanner is a sibling of children -- it floats above
 *     the page when the user hasn't verified yet.
 */
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { EmailVerifyBanner } from "@/components/netstart/EmailVerifyBanner";
import { PrivacyBanner } from "@/components/netstart/PrivacyBanner";
import { SignedOutRedirect } from "@/components/netstart/SignedOutRedirect";
import { SignOutConfirmProvider } from "@/components/netstart/SignOutConfirm";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <SignedOutRedirect />
          <SignOutConfirmProvider>
            <SidebarProvider>
              <EmailVerifyBanner />
              <PrivacyBanner />
              {children}
            </SidebarProvider>
          </SignOutConfirmProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
