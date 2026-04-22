import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Check } from "lucide-react";
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
import { signUpSchema, type SignUpValues } from "@/lib/auth-schemas";
import heroBg from "@/assets/hero-bg.jpg";

const friendlySignUpError = (err: AuthError): string => {
  const msg = err.message.toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists"))
    return "An account with that email already exists. Try signing in instead.";
  if (msg.includes("rate")) return "Too many attempts. Try again in a moment.";
  return err.message;
};

const PERKS = [
  "Vetted builders only",
  "Decisive matching, no maybes",
  "Verified execution signal",
];

const SignUp = () => {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [loading, user, navigate, redirectTo]);

  const onSubmit = async (values: SignUpValues) => {
    setSubmitting(true);
    const { error } = await signUp(values.email, values.password, values.name);
    setSubmitting(false);

    if (error) {
      toast.error(friendlySignUpError(error));
      return;
    }

    toast.success("Check your email to confirm your account.");
    navigate("/signin", { replace: true, state: { from: redirectTo } });
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
              Join the network
            </span>
          </div>
          <h2 className="font-display text-5xl leading-[0.95] mb-8">
            For people who<br />
            <em className="text-gradient-gold not-italic">actually</em> build.
          </h2>
          <ul className="space-y-3 mt-10">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-foreground/80">
                <span className="h-5 w-5 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Check className="h-3 w-3 text-gold" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
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
                Create account
              </p>
              <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
                Start building<br />today.
              </h1>
              <p className="text-muted-foreground text-sm">
                Takes a minute. Confirmation sent to your inbox.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        Full name
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          autoComplete="name"
                          placeholder="Your name"
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
                      <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          className="h-12 bg-card border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-[11px] text-muted-foreground/80 mt-2">
                        Use 8+ characters with upper, lower, and a number.
                      </p>
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
                  {submitting ? "Creating account..." : "Create account"}
                  {!submitting && (
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Already have an account?{" "}
              <Link
                to="/signin"
                state={{ from: redirectTo }}
                className="text-gold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
