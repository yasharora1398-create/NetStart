import { z } from "zod";

export const signInSchema = z.object({
 email: z.string().trim().email("Enter a valid email address"),
 password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
 name: z
 .string()
 .trim()
 .min(2, "Name must be at least 2 characters")
 .max(80, "Name is too long"),
 email: z.string().trim().email("Enter a valid email address"),
 password: z
 .string()
 .min(8, "Password must be at least 8 characters")
 .regex(/[a-z]/, "Password must include a lowercase letter")
 .regex(/[A-Z]/, "Password must include an uppercase letter")
 .regex(/[0-9]/, "Password must include a number"),
 // Role picked at sign-up so we can skip the wizard's mode question
 // and route post-verification users straight to the right setup
 // path. Stored on user_metadata.role.
 role: z.enum(["founder", "partner"], {
 required_error: "Pick founder or partner",
 }),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
