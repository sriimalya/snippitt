"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

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

    const isOwner = currentUserId === post.user.id;

    if (!isOwner) {
      if (post.visibility === "PRIVATE") {
        return {
          success: false,
          message: "This post is private",
          code: "FORBIDDEN",
        };
      }

      if (post.visibility === "FOLLOWERS") {
        if (!currentUserId) {
          return {
            success: false,
            message: "Please log in to view this post",
            code: "UNAUTHORIZED",
          };
        }

        const isFollowing = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: post.user.id,
            },
          },
        });

        if (!isFollowing) {
          return {
            success: false,
            message: "This post is for followers only",
            code: "FORBIDDEN",
          };
        }
      }
    }

    const imageKeys = post.images.map((img) => extractKeyFromUrl(img.url));
    const avatarKey = post.user.avatar
      ? extractKeyFromUrl(post.user.avatar)
      : null;

    const [signedImages, signedAvatar] = await Promise.all([
      Promise.all(imageKeys.map((key) => generatePresignedViewUrl(key))),
      avatarKey ? generatePresignedViewUrl(avatarKey) : null,
    ]);

    const transformedPost = {
      ...post,
      user: { ...post.user, avatar: signedAvatar },
      images: post.images.map((img, idx) => ({
        ...img,
        url: signedImages[idx],
      })),
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
