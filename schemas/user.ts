import { z } from "zod";
//Base User Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  username: z.string(),
  bio: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  emailVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateUserSchema = z.object({
  username: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(300).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  deactivateAccount: z.boolean().optional(),
});

export type User = z.infer<typeof UserSchema>;
