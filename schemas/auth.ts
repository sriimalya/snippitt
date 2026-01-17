import { z } from "zod";
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  username: z.string().min(3, "Username must be at least 3 characters long"),
  phone: z
    .string()
    .refine((value) => /^\+?\d{6,20}$/.test(value), "Invalid phone number")
    .optional(),
});

export const VerificationTokenSchema = z.object({
  id: z.string().cuid(),
  token: z.string(),
  expiresAt: z.date(),
  userId: z.string(),
  purpose: z.string().default("email_verification"), // ← ADD THIS LINE
});

export type Login = z.infer<typeof LoginSchema>;
export type Signup = z.infer<typeof SignupSchema>;
export type VerificationToken = z.infer<typeof VerificationTokenSchema>;
