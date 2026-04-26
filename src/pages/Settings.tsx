import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, Mail, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Nav } from "@/components/netstart/Nav";
import { Footer } from "@/components/netstart/Footer";
import { AuthGate } from "@/components/netstart/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const Settings = () => {
  const {
    user,
    loading,
    updateEmail,
    updatePassword,
    signOut,
  } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || email === user?.email) return;
    setSavingEmail(true);
    try {
      const { error } = await updateEmail(email.trim());
      if (error) toast.error(error.message);
      else toast.success("Confirm via the link in your inbox to finalize.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await updatePassword(password);
      if (error) toast.error(error.message);
      else {
        toast.success("Password updated.");
        setPassword("");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      await signOut("global");
      navigate("/", { replace: true });
    } finally {
      setSigningOutAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-5 w-5 text-gold animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <AuthGate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="pt-28 pb-24">
        <div className="container max-w-2xl">
          <header className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
              Account
            </p>
            <h1 className="font-display text-4xl md:text-5xl leading-[1]">
              Settings
            </h1>
          </header>

          <section className="rounded-sm border border-border bg-card overflow-hidden mb-6">
            <form onSubmit={handleEmail} className="p-6 md:p-8 space-y-4">
              <div>
                <h2 className="font-display text-2xl mb-1 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gold" />
                  Email
                </h2>
                <p className="text-sm text-muted-foreground">
                  Changes require confirmation from the new address.
                </p>
              </div>
              <div>
                <Label
                  htmlFor="email"
                  className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                />
              </div>
              <Button
                type="submit"
                variant="gold"
                size="sm"
                disabled={savingEmail || email === user.email || !email.trim()}
              >
                {savingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update email
              </Button>
            </form>
          </section>

          <section className="rounded-sm border border-border bg-card overflow-hidden mb-6">
            <form onSubmit={handlePassword} className="p-6 md:p-8 space-y-4">
              <div>
                <h2 className="font-display text-2xl mb-1 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-gold" />
                  Password
                </h2>
                <p className="text-sm text-muted-foreground">
                  At least 8 characters.
                </p>
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
                >
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-2 h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                />
              </div>
              <Button
                type="submit"
                variant="gold"
                size="sm"
                disabled={savingPassword || password.length < 8}
              >
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update password
              </Button>
            </form>
          </section>

          <section className="rounded-sm border border-destructive/30 bg-card overflow-hidden">
            <div className="p-6 md:p-8 space-y-4">
              <div>
                <h2 className="font-display text-2xl mb-1 flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-destructive" />
                  Sessions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sign out of every device. You'll need to sign in again
                  everywhere.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOutAll}
                disabled={signingOutAll}
              >
                {signingOutAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign out everywhere
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
