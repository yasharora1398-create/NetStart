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
import { COMMITMENT_OPTIONS, LOCATION_OPTIONS } from "@/lib/options";
import { type Project, type ProjectCriteria, emptyCriteria } from "@/lib/mynet-types";

const schema = z.object({
  title: z.string().trim().min(2, "Give your project a name").max(80),
  description: z.string().trim().max(280).optional().default(""),
  skills: z.array(z.string()),
  commitment: z.string().trim(),
  location: z.string().trim(),
  keywords: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Project;
  onSubmit: (data: { title: string; description: string; criteria: ProjectCriteria }) => void;
};

const toFormValues = (p?: Project): FormValues => ({
  title: p?.title ?? "",
  description: p?.description ?? "",
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

  const handle = (values: FormValues) => {
    setSubmitting(true);
    const criteria: ProjectCriteria = {
      skills: values.skills,
      commitment: values.commitment,
      location: values.location,
      keywords: values.keywords,
    };
    onSubmit({
      title: values.title,
      description: values.description ?? "",
      criteria,
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  const editing = Boolean(initial);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-gold-soft">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {editing ? "Edit project" : "New project"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define what you're building and the kind of operator you want next to you.
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
                      className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
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
                      className="bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
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
                      placeholder="e.g. Rust, Marketplaces, B2B GTM (Enter to add)"
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-11 bg-background border-border focus:border-gold/60 focus:ring-gold/20">
                          <SelectValue placeholder="What you need from them" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {COMMITMENT_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="mb-5">
                    <FormLabel className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      Location
                    </FormLabel>
                    <FormControl>
                      <Autocomplete
                        value={field.value}
                        onChange={field.onChange}
                        options={LOCATION_OPTIONS}
                        placeholder="Type a city or pick remote..."
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
                        className="h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
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
