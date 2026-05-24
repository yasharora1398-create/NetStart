import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "./TagInput";
import {
 BUSINESS_TYPE_OPTIONS,
 COMMITMENT_OPTIONS,
 LOCATION_OPTIONS,
 SKILLS_OPTIONS,
} from "@/lib/options";
import { type Project, type ProjectCriteria, emptyCriteria } from "@/lib/mynet-types";

const schema = z.object({
 title: z.string().trim().min(2, "Give your project a name").max(80),
 description: z.string().trim().max(280).optional().default(""),
 businessType: z.string().trim(),
 skills: z.array(z.string()),
 commitment: z.string().trim(),
 // Optional: an empty string is fine (the toggle next to the
 // field defaults to OFF for new projects).
 location: z.string().trim().optional().default(""),
 keywords: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

type ProjectDialogProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 initial?: Project;
 onSubmit: (data: {
 title: string;
 description: string;
 criteria: ProjectCriteria;
 businessType: string;
 }) => void | Promise<void>;
};

const toFormValues = (p?: Project): FormValues => ({
 title: p?.title ?? "",
 description: p?.description ?? "",
 businessType: p?.businessType ?? "",
 skills: p?.criteria.skills ?? [],
 commitment: p?.criteria.commitment ?? "",
 location: p?.criteria.location ?? "",
 keywords: p?.criteria.keywords ?? "",
});

export const ProjectDialog = ({
 open,
 onOpenChange,
 initial,
 onSubmit,
}: ProjectDialogProps) => {
 const [submitting, setSubmitting] = useState(false);

 const form = useForm<FormValues>({
 resolver: zodResolver(schema),
 defaultValues: toFormValues(initial),
 });

 useEffect(() => {
 if (open) form.reset(toFormValues(initial));
 }, [open, initial, form]);

 const handle = async (values: FormValues) => {
 setSubmitting(true);
 const criteria: ProjectCriteria = {
 skills: values.skills,
 commitment: values.commitment,
 location: values.location,
 keywords: values.keywords,
 };
 try {
 await onSubmit({
 title: values.title,
 description: values.description ?? "",
 criteria,
 businessType: values.businessType,
 });
 onOpenChange(false);
 } catch {
 // Parent shows the toast; keep the dialog open so the user can
 // fix the issue and retry without losing what they typed.
 } finally {
 setSubmitting(false);
 }
 };

 const editing = Boolean(initial);

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-xl bg-card border-gold">
 <DialogHeader>
 <DialogTitle className="font-display text-2xl">
 {editing ? "Edit project" : "New project"}
 </DialogTitle>
 <DialogDescription className="text-muted-foreground">
 Define what you're building and the kind of partner you want next to you.
 </DialogDescription>
 </DialogHeader>

 <Form {...form}>
 <form
 onSubmit={form.handleSubmit(handle)}
 className="space-y-5 max-h-[70vh] overflow-y-auto pr-1"
 noValidate
 >
 <FormField
 control={form.control}
 name="title"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Project name
 </FormLabel>
 <FormControl>
 <Input
 placeholder="e.g. Vertical AI for logistics"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 {...field}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="description"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 What you're building
 </FormLabel>
 <FormControl>
 <Textarea
 rows={3}
 placeholder="One or two sentences. Stage, market, what's already shipped."
 className="bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 {...field}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <div className="border-t border-border pt-5">
 <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold mb-1">
 Criteria
 </p>
 <p className="text-xs text-muted-foreground mb-5">
 Used by Find People to surface matches.
 </p>

 <Controller
 control={form.control}
 name="skills"
 render={({ field }) => (
 <FormItem className="mb-5">
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Skills
 </FormLabel>
 <TagInput
 value={field.value}
 onChange={field.onChange}
 options={SKILLS_OPTIONS}
 placeholder="Type to filter, click to add..."
 />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="commitment"
 render={({ field }) => (
 <FormItem className="mb-5">
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Commitment
 </FormLabel>
 <FormControl>
 <Autocomplete
 value={field.value}
 onChange={field.onChange}
 options={COMMITMENT_OPTIONS}
 placeholder="Type or pick what you need from them..."
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="location"
 render={({ field }) => {
 const enabled = Boolean(field.value?.trim());
 return (
 <FormItem className="mb-5">
 <div className="flex items-center justify-between gap-3 mb-2">
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Location
 </Label>
 <div className="flex items-center gap-2">
 <span
 className={`text-[11px] font-mono uppercase tracking-[0.18em] ${
 enabled ? "text-gold" : "text-muted-foreground"
 }`}
 >
 {enabled ? "On" : "Off"}
 </span>
 <Switch
 checked={enabled}
 onCheckedChange={(next) => {
 // Toggle drives the value: turning off clears the
 // string, turning on opens the picker with the
 // value empty until the user picks.
 if (!next) field.onChange("");
 else field.onChange(field.value || " ");
 }}
 aria-label="Toggle location field"
 />
 </div>
 </div>
 <FormControl>
 {enabled ? (
 <Autocomplete
 value={field.value?.trim() ?? ""}
 onChange={field.onChange}
 options={LOCATION_OPTIONS}
 placeholder="Pick a country..."
 />
 ) : (
 <div className="h-11 rounded-sm border border-dashed border-border bg-background px-3 flex items-center text-[12px] text-muted-foreground">
 Location off - turn on to pick a country.
 </div>
 )}
 </FormControl>
 <p className="text-[11px] text-muted-foreground mt-2">
 Adding a location is beneficial but not required.
 </p>
 <FormMessage />
 </FormItem>
 );
 }}
 />

 <FormField
 control={form.control}
 name="businessType"
 render={({ field }) => (
 <FormItem className="mb-5">
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Business type
 </FormLabel>
 <FormControl>
 <Autocomplete
 value={field.value}
 onChange={field.onChange}
 options={BUSINESS_TYPE_OPTIONS}
 placeholder="SaaS, Marketplace, Hardware..."
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="keywords"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Keywords
 </FormLabel>
 <FormControl>
 <Input
 placeholder="e.g. payments, fintech, ex-Stripe"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 {...field}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>

 <DialogFooter className="pt-2">
 <Button
 type="button"
 variant="ghost"
 onClick={() => onOpenChange(false)}
 >
 Cancel
 </Button>
 <Button type="submit" variant="gold" disabled={submitting}>
 {editing ? "Save changes" : "Create project"}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
};

export const _emptyCriteria = emptyCriteria;
