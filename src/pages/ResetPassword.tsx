import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/netstart/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const ResetPassword = () => {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate("/mynet", { replace: true }), 1800);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message);
      } else {
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-6">
        <Link to="/" aria-label="NetStart home">
          <Logo />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {done ? (
            <div className="rounded-sm border border-emerald-500/40 bg-card p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-emerald-500/40 bg-emerald-500/10 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400 mb-2">
                Updated
              </p>
              <h1 className="font-display text-3xl mb-3">Password set.</h1>
              <p className="text-sm text-muted-foreground">
                Sending you to MyNet...
              </p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            </div>
          ) : !user ? (
            <div className="rounded-sm border border-destructive/40 bg-card p-8 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-destructive mb-2">
                Link expired
              </p>
              <h1 className="font-display text-3xl mb-3">Try again.</h1>
              <p className="text-sm text-muted-foreground mb-6">
                The reset link is invalid or has expired.
              </p>
              <Link to="/forgot-password">
                <Button variant="gold" size="lg">
                  Request a new link
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
                Set a new password
              </p>
              <h1 className="font-display text-4xl leading-[1] mb-8">
                Almost done.
              </h1>
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    autoFocus
                    className="mt-2 h-12 bg-card border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="confirm"
                    className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    Confirm
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    className="mt-2 h-12 bg-card border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                  />
                </div>
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
