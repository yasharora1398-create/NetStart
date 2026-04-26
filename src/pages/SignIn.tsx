import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Logo } from "@/components/netstart/Logo";
import { useAuth } from "@/context/AuthContext";
import { signInSchema, type SignInValues } from "@/lib/auth-schemas";
import heroBg from "@/assets/hero-bg.jpg";

const friendlySignInError = (err: AuthError): string => {
  const msg = err.message.toLowerCase();
  if (msg.includes("invalid login")) return "Incorrect email or password.";
  if (msg.includes("email not confirmed"))
    return "Confirm your email first. Check your inbox for the verification link.";
  if (msg.includes("rate")) return "Too many attempts. Try again in a moment.";
  return err.message;
};

const SignIn = () => {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [loading, user, navigate, redirectTo]);

  const onSubmit = async (values: SignInValues) => {
    setSubmitting(true);
    const { error } = await signIn(values.email, values.password);
    setSubmitting(false);

    if (error) {
      toast.error(friendlySignInError(error));
      return;
    }

    toast.success("Welcome back.");
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="hidden lg:flex relative flex-col justify-between p-12 border-r border-gold-soft overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-spotlight opacity-60" />

        <Link to="/" aria-label="NetStart home" className="relative z-10">
          <Logo />
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-8">
            <Sparkles className="h-3 w-3 text-gold" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
              Welcome back
            </span>
          </div>
          <h2 className="font-display text-5xl leading-[0.95] mb-8">
            Work with operators,<br />
            <em className="text-gradient-gold not-italic">not talkers.</em>
          </h2>
          <div className="flex gap-12 mt-12">
            <div>
              <p className="font-display text-3xl text-gold">2,840</p>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
                verified builders
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold">312</p>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
                companies started
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          © NetStart · A network for builders
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col">
        <header className="lg:hidden border-b border-gold-soft">
          <div className="container h-16 flex items-center">
            <Link to="/" aria-label="Back to home">
              <Logo />
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-4">
                Sign in
              </p>
              <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
                Pick up where<br />you left off.
              </h1>
              <p className="text-muted-foreground text-sm">
                Continue building with the operators in your network.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          className="h-12 bg-card border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                          Password
                        </FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Your password"
                          className="h-12 bg-card border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full h-12 group"
                  disabled={submitting}
                >
                  {submitting ? "Signing in..." : "Sign in"}
                  {!submitting && (
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-widest">
                <span className="bg-background px-3 text-muted-foreground">New here</span>
              </div>
            </div>

            <Link to="/signup" state={{ from: redirectTo }}>
              <Button variant="outlineGold" size="lg" className="w-full h-12">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
