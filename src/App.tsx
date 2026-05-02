import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { EmailVerifyBanner } from "@/components/netstart/EmailVerifyBanner";
import Index from "./pages/Index.tsx";
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
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/mynet" element={<MyNet />} />
            <Route path="/talent" element={<Talent />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/match" element={<Match />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/standards" element={<Standards />} />
            <Route path="/how" element={<HowItWorks />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/u/:id" element={<FounderProfile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
