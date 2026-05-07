import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { EmailVerifyBanner } from "@/components/netstart/EmailVerifyBanner";
import Index from "./pages/Index.tsx";
import Waitlist from "./pages/Waitlist.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import MyNet from "./pages/MyNet.tsx";
import Talent from "./pages/Talent.tsx";
import Admin from "./pages/Admin.tsx";
import Chats from "./pages/Chats.tsx";
import Match from "./pages/Match.tsx";
import Settings from "./pages/Settings.tsx";
import Standards from "./pages/Standards.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import DownloadPage from "./pages/DownloadPage.tsx";
import FounderProfile from "./pages/FounderProfile.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Production (Vercel) ships ONLY the waitlist + the routes needed to
// actually sign up / sign in. Every internal product route (mynet,
// match, chats, admin, /u/:id, etc.) redirects to "/" so the
// unfinished product stays hidden from the public.
//
// In dev (localhost) every route works exactly as it always did, so
// we can keep iterating the full app.
//
// `import.meta.env.PROD` is true under `vite build` (what Vercel
// runs) and false under `vite dev` (localhost).
const PROD = import.meta.env.PROD;
const HomePage = PROD ? Waitlist : Index;

// Wraps an internal route's element. In prod, hard-redirects to the
// waitlist; in dev, passes through unchanged.
const Internal = ({ children }: { children: ReactNode }) =>
  PROD ? <Navigate to="/" replace /> : <>{children}</>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <EmailVerifyBanner />
          <Routes>
            {/* Public routes — accessible in both dev and prod. */}
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Internal product routes — wrapped with <Internal> so
                they redirect to "/" in production. In dev they work
                exactly as before.
                Exception: /mynet is public so the post-signup flow
                can land users on the MyNetWizard. The page itself
                already gates content behind auth via <AuthGate>. */}
            <Route path="/mynet" element={<MyNet />} />
            <Route path="/talent" element={<Internal><Talent /></Internal>} />
            <Route path="/admin" element={<Internal><Admin /></Internal>} />
            <Route path="/match" element={<Internal><Match /></Internal>} />
            <Route path="/chats" element={<Internal><Chats /></Internal>} />
            <Route path="/standards" element={<Internal><Standards /></Internal>} />
            <Route path="/how" element={<Internal><HowItWorks /></Internal>} />
            <Route path="/download" element={<Internal><DownloadPage /></Internal>} />
            <Route path="/settings" element={<Internal><Settings /></Internal>} />
            <Route path="/u/:id" element={<Internal><FounderProfile /></Internal>} />

            {/* In prod, send unknown routes home so people who guess
                URLs land on the waitlist instead of a 404. In dev,
                show the regular NotFound page. */}
            <Route
              path="*"
              element={PROD ? <Navigate to="/" replace /> : <NotFound />}
            />
          </Routes>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
