import { useState } from "react";
import { Loader2, MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export const EmailVerifyBanner = () => {
  const { user, emailVerified, resendVerification } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || emailVerified || hidden) return null;

  const email = user.email ?? "";

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    try {
      const { error } = await resendVerification(email);
      if (error) toast.error(error.message);
      else toast.success("Verification email sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed top-16 inset-x-0 z-40 px-3 sm:px-6 pt-2">
      <div className="container max-w-3xl">
        <div className="rounded-sm border border-gold/40 bg-card/95 backdrop-blur-md shadow-lg p-3 sm:p-4 flex items-center gap-3 flex-wrap">
          <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <MailWarning className="h-4 w-4 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">Verify your email.</span>{" "}
              <span className="text-muted-foreground">
                We sent a link to {email}.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outlineGold"
              size="sm"
              onClick={handleResend}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Resend
            </Button>
            <button
              type="button"
              onClick={() => setHidden(true)}
              aria-label="Dismiss"
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
