import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/netstart/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const ForgotPassword = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await requestPasswordReset(email.trim());
      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
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
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>

          {sent ? (
            <div className="rounded-sm border border-gold-soft bg-card p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 mb-4">
                <MailCheck className="h-5 w-5 text-gold" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
                Sent
              </p>
              <h1 className="font-display text-3xl mb-3">Check your inbox.</h1>
              <p className="text-sm text-muted-foreground">
                We sent a reset link to{" "}
                <span className="text-foreground">{email}</span>. The link
                expires in an hour.
              </p>
            </div>
          ) : (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
                Reset
              </p>
              <h1 className="font-display text-4xl leading-[1] mb-3">
                Forgot your password?
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                We'll email you a link to set a new one.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
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
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
