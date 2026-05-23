"use client";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
 AlertCircle,
 ArrowRight,
 CheckCircle2,
 Eye,
 EyeOff,
 Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/netstart/Logo";
import { Button } from "@/components/ui/button";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

// Mirror the signup password rules so reset is held to the same bar.
const schema = z
 .object({
 password: z
 .string()
 .min(8, "Password must be at least 8 characters")
 .regex(/[a-z]/, "Password must include a lowercase letter")
 .regex(/[A-Z]/, "Password must include an uppercase letter")
 .regex(/[0-9]/, "Password must include a number"),
 confirm: z.string(),
 })
 .refine((d) => d.password === d.confirm, {
 path: ["confirm"],
 message: "Both fields must match.",
 });

type ResetValues = z.infer<typeof schema>;

const friendlyError = (msg: string): string => {
 const lower = msg.toLowerCase();
 if (lower.includes("same password") || lower.includes("should be different"))
 return "New password must be different from your old one.";
 if (lower.includes("rate") || lower.includes("for security"))
 return "Too many requests. Wait a minute and try again.";
 if (lower.includes("network") || lower.includes("fetch"))
 return "Network error. Check your connection and try again.";
 return msg;
};

import { useForceLightMode } from "@/hooks/useForceLightMode";

const ResetPassword = () => {
 useForceLightMode();
 const { user, loading, updatePassword } = useAuth();
 const navigate = useNavigate();
 const [submitting, setSubmitting] = useState(false);
 const [done, setDone] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [capsLock, setCapsLock] = useState(false);

 const form = useForm<ResetValues>({
 resolver: zodResolver(schema),
 defaultValues: { password: "", confirm: "" },
 mode: "onBlur",
 });

 useEffect(() => {
 if (done) {
 const t = setTimeout(() => navigate("/", { replace: true }), 1800);
 return () => clearTimeout(t);
 }
 }, [done, navigate]);

 const onSubmit = async (values: ResetValues) => {
 setSubmitting(true);
 const { error } = await updatePassword(values.password);
 setSubmitting(false);
 if (error) {
 toast.error(friendlyError(error.message));
 return;
 }
 setDone(true);
 };

 const onPasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (typeof e.getModifierState === "function") {
 setCapsLock(e.getModifierState("CapsLock"));
 }
 };

 return (
 <div className="min-h-screen bg-background text-foreground flex flex-col">
 <header className="px-6 py-6">
 <Link to="/" aria-label="Polln8 home">
 <Logo />
 </Link>
 </header>

 <main className="flex-1 flex items-center justify-center px-6 py-10">
 <div className="w-full max-w-md">
 {done ? (
 <div className="rounded-sm border border-emerald-500 bg-card p-8 text-center">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-emerald-500 bg-emerald-500 mb-4">
 <CheckCircle2 className="h-5 w-5 text-emerald-400" />
 </div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400 mb-2">
 Updated
 </p>
 <h1 className="font-display text-3xl mb-3">Password set.</h1>
 <p className="text-sm text-muted-foreground">
 Sending you home...
 </p>
 </div>
 ) : loading ? (
 <div className="flex justify-center py-10">
 <Loader2 className="h-5 w-5 text-gold animate-spin" />
 </div>
 ) : !user ? (
 <div className="rounded-sm border border-destructive bg-card p-8 text-center">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-destructive mb-2">
 Link expired
 </p>
 <h1 className="font-display text-3xl mb-3">Try again.</h1>
 <p className="text-sm text-muted-foreground mb-6">
 The reset link is invalid or has expired. Reset links are
 valid for one hour after you request them.
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
 <Form {...form}>
 <form
 onSubmit={form.handleSubmit(onSubmit)}
 className="space-y-5"
 noValidate
 >
 <fieldset disabled={submitting} className="space-y-5">
 <FormField
 control={form.control}
 name="password"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 New password
 </FormLabel>
 <FormControl>
 <div className="relative">
 <Input
 type={showPassword ? "text" : "password"}
 autoComplete="new-password"
 autoFocus
 placeholder="At least 8 characters"
 className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold pr-12"
 {...field}
 onKeyUp={onPasswordKey}
 onKeyDown={onPasswordKey}
 />
 <button
 type="button"
 onClick={() => setShowPassword((v) => !v)}
 tabIndex={-1}
 aria-label={
 showPassword
 ? "Hide password"
 : "Show password"
 }
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 >
 {showPassword ? (
 <EyeOff className="h-4 w-4" />
 ) : (
 <Eye className="h-4 w-4" />
 )}
 </button>
 </div>
 </FormControl>
 <FormMessage />
 {capsLock && (
 <p className="flex items-center gap-1.5 text-[11px] text-gold mt-2">
 <AlertCircle className="h-3 w-3" />
 Caps Lock is on.
 </p>
 )}
 <p className="text-[11px] text-muted-foreground mt-2">
 Use 8+ characters with upper, lower, and a number.
 </p>
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="confirm"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Confirm
 </FormLabel>
 <FormControl>
 <div className="relative">
 <Input
 type={showConfirm ? "text" : "password"}
 autoComplete="new-password"
 placeholder="Re-enter password"
 className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold pr-12"
 {...field}
 onKeyUp={onPasswordKey}
 onKeyDown={onPasswordKey}
 />
 <button
 type="button"
 onClick={() => setShowConfirm((v) => !v)}
 tabIndex={-1}
 aria-label={
 showConfirm ? "Hide password" : "Show password"
 }
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 >
 {showConfirm ? (
 <EyeOff className="h-4 w-4" />
 ) : (
 <Eye className="h-4 w-4" />
 )}
 </button>
 </div>
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </fieldset>
 <Button
 type="submit"
 variant="gold"
 size="lg"
 className="w-full h-12 group"
 disabled={submitting}
 >
 {submitting ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Updating...
 </>
 ) : (
 <>
 Update password
 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
 </>
 )}
 </Button>
 </form>
 </Form>
 </>
 )}
 </div>
 </main>
 </div>
 );
};

export default ResetPassword;
