"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { deleteFile, extractKeyFromUrl } from "@/lib/aws_s3";

export async function deletePost(postId: string): Promise<{
  success: boolean;
  message: string;
  code?: string;
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

    const userId = session.user.id;

    // 1. Fetch post and its images to identify the cover and clean up S3
    const post = await prisma.post.findUnique({
      where: { id: postId, userId },
      include: {
        images: {
          select: {
            url: true,
            isCover: true,
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Post not found or access denied",
        code: "POST_NOT_FOUND",
      };
    }

    // 2. Identify the cover image URL from the related images
    const coverImageUrl = post.images.find((img) => img.isCover)?.url;

    // 3. Delete from database in transaction
    await prisma.$transaction(async (tx) => {
      // Update collections that specifically used this post's cover image
      if (coverImageUrl) {
        await tx.collection.updateMany({
          where: {
            userId,
            coverImage: coverImageUrl,
          },
          data: { coverImage: null },
        });
      }

      // Delete the post (cascades to images, comments, likes due to schema)
      await tx.post.delete({
        where: { id: postId },
      });
    });

    // 4. Async S3 cleanup (Fire and forget)
    const cleanupS3 = async () => {
      // Every image related to the post (including the cover) is in this array
      const urlsToDelete = post.images.map((img) => img.url);

      const keysToDelete = urlsToDelete
        .map((url) => {
          try {
            return extractKeyFromUrl(url);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[];

      // Use settled to ensure one failure doesn't stop others
      await Promise.allSettled(keysToDelete.map((key) => deleteFile(key)));
    };

    cleanupS3();

    return {
      success: true,
      message: "Post deleted successfully",
    };
  } catch (error) {
    console.error("Delete post error:", error);
    return {
      success: false,
      message: "An error occurred while deleting the post",
      code: "DELETE_POST_FAILED",
    };
  }
}
