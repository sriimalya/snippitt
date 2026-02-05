// actions/posts/getPost.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
import type { Post, } from "@/schemas/post";

interface GetPostOptions {
  includeSignedUrls?: boolean;
}

export async function getPost(
  postId: string,
  options: GetPostOptions = { includeSignedUrls: true }
): Promise<{
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
        message: "Authentication required",
        code: "UNAUTHORIZED",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        message: "User account not found",
        code: "USER_NOT_FOUND",
      };
    }

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        images: {
          orderBy: { createdAt: "asc" },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            savedBy: true,
          },
        },
        likes: {
          where: { userId: user.id },
          select: { userId: true },
        },
        savedBy: {
          where: { userId: user.id },
          select: { userId: true },
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

    // Transform to Post interface
    const transformedPost: Post = {
      id: post.id,
      title: post.title,
      description: post.description,
      category: post.category,
      visibility: post.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
      isDraft: post.isDraft,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: {
        id: post.user.id,
        username: post.user.username,
        avatar: post.user.avatar,
      },
      // Add images to the Post type
      images: post.images.map(img => ({
        id: img.id,
        url: img.url,
        description: img.description,
        isCover: img.isCover,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })),
      tags: post.tags.map((t) => t.tag.name),
      _count: {
        likes: post._count.likes,
        comments: post._count.comments,
        savedBy: post._count.savedBy,
      },
      isLiked: post.likes.length > 0,
      isSaved: post.savedBy.length > 0,
      linkTo: `/post/${post.id}`,
    };

    // In getPost, when processing images:
if (options.includeSignedUrls) {
  transformedPost.images = await Promise.all(
    post.images.map(async (img) => {
      try {
        // Generate signed URL for each image
        const key = extractKeyFromUrl(img.url); // This extracts 'uploads/...' from the URL
        const signedUrl = await generatePresignedViewUrl(key);
        
        return {
          id: img.id,
          url: signedUrl, // ← Use the signed URL
          description: img.description,
          isCover: img.isCover,
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        };
      } catch (error) {
        console.error(`Failed to sign image ${img.id}:`, error);
        // Fall back to original URL if signing fails
        return {
          id: img.id,
          url: img.url,
          description: img.description,
          isCover: img.isCover,
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        };
      }
    })
  );
  
  // Also generate signed URL for cover image
  const coverImage = post.images.find((img) => img.isCover);
  if (coverImage) {
    try {
      const key = extractKeyFromUrl(coverImage.url);
      const signedUrl = await generatePresignedViewUrl(key);
      transformedPost.coverImage = signedUrl;
    } catch (error) {
      console.error("Failed to generate signed URL for cover:", error);
      transformedPost.coverImage = coverImage.url;
    }
  }
} else {
  // If not including signed URLs, use original URLs
  transformedPost.images = post.images.map(img => ({
    id: img.id,
    url: img.url,
    description: img.description,
    isCover: img.isCover,
    createdAt: img.createdAt,
    updatedAt: img.updatedAt,
  }));
  
  const coverImage = post.images.find((img) => img.isCover);
  transformedPost.coverImage = coverImage?.url || null;
}

    return {
      success: true,
      message: "Post retrieved successfully",
      data: transformedPost,
    };
  } catch (error) {
    console.error("Post Fetch Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while fetching the post",
      code: "INTERNAL_SERVER_ERROR",
    };
  }
}