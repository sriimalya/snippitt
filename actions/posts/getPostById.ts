"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

/**
 * Helper to handle both S3 and External (Google) URLs
 */
async function getValidImageUrl(url: string | null | undefined) {
  if (!url) return null;
  // If it's a Google URL or a full external link, return as is
  const isExternal =
    url.includes("googleusercontent.com") ||
    (url.includes("http") && !url.includes("amazonaws.com"));
  if (isExternal) return url;

  try {
    const key = extractKeyFromUrl(url);
    return await generatePresignedViewUrl(key);
  } catch (error) {
    return url;
  }
}

export async function getPostById(postId: string) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        images: { orderBy: { createdAt: "asc" } },
        _count: { select: { likes: true, comments: true, savedBy: true } },
        likes: currentUserId ? { where: { userId: currentUserId } } : false,
        savedBy: currentUserId ? { where: { userId: currentUserId } } : false,
      },
    });

    if (!post) {
      return { success: false, message: "Post not found", code: "NOT_FOUND" };
    }

    // --- Access Control Logic (Keep your existing checks here) ---
    const isOwner = currentUserId === post.user.id;
    if (!isOwner) {
      if (post.visibility === "PRIVATE")
        return { success: false, message: "Private", code: "FORBIDDEN" };
      if (post.visibility === "FOLLOWERS") {
        if (!currentUserId)
          return {
            success: false,
            message: "Login required",
            code: "UNAUTHORIZED",
          };
        const isFollowing = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: post.user.id,
            },
          },
        });
        if (!isFollowing)
          return {
            success: false,
            message: "Followers only",
            code: "FORBIDDEN",
          };
      }
    }

    // --- SMART SIGNING LOGIC ---

    // 1. Sign all post images (usually S3)
    const signedImages = await Promise.all(
      post.images.map(async (img) => ({
        ...img,
        url: await getValidImageUrl(img.url),
      })),
    );

    // 2. Sign author avatar (Handles Google vs S3)
    const signedAvatar = await getValidImageUrl(post.user.avatar);

    const transformedPost = {
      ...post,
      user: { ...post.user, avatar: signedAvatar },
      images: signedImages,
      isLiked: currentUserId ? post.likes.length > 0 : false,
      isSaved: currentUserId ? post.savedBy.length > 0 : false,
    };

    return {
      success: true,
      data: transformedPost,
      currentUserId: currentUserId || null,
      isOwner,
    };
  } catch (error) {
    console.error("getPostById Error:", error);
    return { success: false, message: "Internal server error" };
  }
}
