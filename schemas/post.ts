import { z } from "zod";
import { Category } from "@/app/generated/prisma/enums";

export const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),

  description: z.string().min(1, "Description is required"),

  category: z.nativeEnum(Category),

  tags: z
    .array(z.string().min(1, "Tag cannot be empty"))
    .min(1, "At least one tag is required")
    .max(10, "Too many tags"),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

// ==================New====================
export interface User {
  id: string;
  username: string;
  avatar?: string | null;
}

export interface Counts {
  likes: number;
  comments: number;
  savedBy: number;
}

export type Visibility = "PUBLIC" | "PRIVATE" | "FOLLOWERS";

// schemas/post.ts
export interface PostImage {
  id: string;
  url: string;
  description: string | null;
  isCover: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: Visibility;
  isDraft: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // User info
  user: User;
  
  // Cover image (with signed URL)
  coverImage?: string | null;
  
  // All images
  images: PostImage[];
  
  // Tags
  tags: string[];
  
  // Counts
  _count: Counts;
  
  // User engagement flags
  isLiked: boolean;
  isSaved: boolean;
  
  // For navigation
  linkTo?: string;
}