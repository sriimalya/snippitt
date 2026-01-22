// actions/posts/updatePost.ts
"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import type { Post } from "@/schemas/post";
import { Category, Visibility } from "@/app/generated/prisma/enums";
import {
  changeFileVisibility,
  deleteFile,
  extractKeyFromUrl,
} from "@/lib/aws_s3";

// Schema for image data in update
const UpdateImageSchema = z.object({
  url: z.string(),
  description: z.string().optional().default(""),
  isCover: z.boolean().default(false),
  existingImageId: z.string().optional(),
});

// Schema for update post
const UpdatePostSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.nativeEnum(Category),
  tags: z.array(z.string().min(1)).min(1).max(10),
  visibility: z.nativeEnum(Visibility),
  isDraft: z.boolean().default(false),
  images: z.array(UpdateImageSchema).max(10),
});

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

export async function updatePost(input: UpdatePostInput): Promise<{
  success: boolean;
  message: string;
  code?: string;
  data?: Post;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Validate input
    const validatedData = UpdatePostSchema.parse(input);
    const {
      id: postId,
      title,
      description,
      tags,
      category,
      visibility,
      images: incomingImages,
      isDraft,
    } = validatedData;

    const userId = session.user.id;

    // Get existing post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId, userId },
      include: {
        images: {
          select: {
            id: true,
            url: true,
            description: true,
            isCover: true,
          },
        },
      },
    });

    if (!existingPost) {
      return {
        success: false,
        message: "Post not found or access denied",
        code: "POST_NOT_FOUND",
      };
    }

    // Helper to clean URLs
    const cleanUrl = (url: string) => url.split("?")[0].split("#")[0];

    // Categorize images
    const existingImageUrls = existingPost.images.map((img) =>
      cleanUrl(img.url),
    );

    const newImages = incomingImages.filter(
      (img) =>
        !img.existingImageId && !existingImageUrls.includes(cleanUrl(img.url)),
    );

    const updatedImages = incomingImages.filter(
      (img) =>
        img.existingImageId && existingImageUrls.includes(cleanUrl(img.url)),
    );

    const deletedImages = existingPost.images.filter(
      (img) =>
        !incomingImages.some((i) => cleanUrl(i.url) === cleanUrl(img.url)),
    );

    // Process new images (move from temp to permanent)
    const processedNewImages = await Promise.all(
      newImages.map(async (img) => {
        try {
          if (img.url.includes("/uploads/")) {
            return { ...img, url: cleanUrl(img.url) };
          }
          const tempKey = extractKeyFromUrl(img.url);
          const newUrl = await changeFileVisibility(tempKey);
          return { ...img, url: cleanUrl(newUrl) };
        } catch (error) {
          console.error("Failed to process image:", img.url, error);
          throw new Error(`Failed to process image: ${img.url}`);
        }
      }),
    );

    // Delete removed images from S3
    await Promise.allSettled(
      deletedImages.map(async (img) => {
        try {
          const key = extractKeyFromUrl(img.url);
          await deleteFile(key);
        } catch (error) {
          console.error("Failed to delete image from S3:", img.url, error);
        }
      }),
    );

    // Update database in transaction
    const updatedPost = await prisma.$transaction(async (tx) => {
      // 1. Delete removed images
      if (deletedImages.length > 0) {
        await tx.image.deleteMany({
          where: {
            postId,
            id: { in: deletedImages.map((img) => img.id) },
          },
        });
      }

      // 2. Reset all cover flags
      await tx.image.updateMany({
        where: { postId },
        data: { isCover: false },
      });

      // 3. Update post
      const post = await tx.post.update({
        where: { id: postId, userId },
        data: {
          title,
          description,
          category,
          visibility,
          isDraft,
          updatedAt: new Date(),
        },
      });
      await tx.postTag.deleteMany({ where: { postId } });

      if (tags.length > 0) {
        const tagOperations = tags.map(async (tagName) => {
          const tag = await tx.tag.upsert({
            where: { name: tagName.toLowerCase() },
            update: {},
            create: { name: tagName.toLowerCase() },
          });

          await tx.postTag.create({
            data: { postId, tagId: tag.id },
          });
        });

        await Promise.all(tagOperations);
      }

      // 4. Create new images
      if (processedNewImages.length > 0) {
        await tx.image.createMany({
          data: processedNewImages.map((img) => ({
            url: img.url,
            description: img.description,
            postId,
            isCover: img.isCover,
          })),
        });
      }

      // 5. Update existing images
      for (const img of updatedImages) {
        const existing = existingPost.images.find(
          (ex) => ex.id === img.existingImageId,
        );
        if (existing) {
          await tx.image.update({
            where: { id: existing.id },
            data: {
              description: img.description,
              isCover: img.isCover,
            },
          });
        }
      }

      // 6. Handle tags
      await tx.postTag.deleteMany({ where: { postId } });

      if (tags.length > 0) {
        const tagOperations = tags.map(async (tagName) => {
          const tag = await tx.tag.upsert({
            where: { name: tagName.toLowerCase() },
            update: {},
            create: { name: tagName.toLowerCase() },
          });

          await tx.postTag.create({
            data: { postId, tagId: tag.id },
          });
        });

        await Promise.all(tagOperations);
      }

      // Return updated post with relations
      return await tx.post.findUnique({
        where: { id: postId },
        include: {
          images: { orderBy: { createdAt: "asc" } },
          tags: { include: { tag: true } },
          _count: {
            select: { likes: true, comments: true, savedBy: true },
          },
          likes: { where: { userId }, select: { userId: true } },
          savedBy: { where: { userId }, select: { userId: true } },
        },
      });
    });

    if (!updatedPost) {
      return {
        success: false,
        message: "Failed to update post",
        code: "UPDATE_FAILED",
      };
    }

    // Transform to Post interface
    const transformedPost: Post = {
      id: updatedPost.id,
      title: updatedPost.title,
      description: updatedPost.description,
      category: updatedPost.category,
      visibility: updatedPost.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
      isDraft: updatedPost.isDraft,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      images: updatedPost.images.map((img) => ({
        id: img.id,
        url: img.url,
        description: img.description,
        isCover: img.isCover,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })),
      user: {
        id: updatedPost.userId,
        username: session.user.username || "", 
      },
      tags: updatedPost.tags.map((t) => t.tag.name),
      _count: {
        likes: updatedPost._count.likes,
        comments: updatedPost._count.comments,
        savedBy: updatedPost._count.savedBy,
      },
      isLiked: updatedPost.likes.length > 0,
      isSaved: updatedPost.savedBy.length > 0,
      linkTo: `/explore/post/${updatedPost.id}`,
    };

    // Set cover image
    const coverImage = updatedPost.images.find((img) => img.isCover);
    transformedPost.coverImage = coverImage?.url || null;

    return {
      success: true,
      message: isDraft
        ? "Draft saved successfully"
        : "Post updated successfully",
      data: transformedPost,
    };
  } catch (error) {
    console.error("Post update error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }

    return {
      success: false,
      message: "An error occurred while updating the post",
      code: "UPDATE_POST_FAILED",
    };
  }
}
