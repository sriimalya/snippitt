// actions/posts/getMyPosts.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";

import type { Post } from "@/schemas/post";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

interface GetMyPostsOptions {
  page?: number;
  perPage?: number;
  category?: string;
}

export async function getMyPosts(options: GetMyPostsOptions = {}): Promise<{
  success: boolean;
  message: string;
  code?: string;
  data?: {
    posts: Post[];
    pagination: {
      currentPage: number;
      perPage: number;
      totalPages: number;
      totalPosts: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    currentUserId: string;
  };
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to view your posts",
        code: "UNAUTHORIZED",
      };
    }

    const userId = session.user.id;
    const perPage = options.perPage || 10;
    const page = options.page || 1;
    const skip = (page - 1) * perPage;

    // 1. Build where clause - fetching ALL posts for the owner
    // Owners see their own PRIVATE, PUBLIC, FOLLOWERS, and DRAFT posts.
    const whereClause: any = {
      userId,
    };

    if (options.category) {
      whereClause.category = options.category;
    }

    // 2. Fetch data in parallel
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          images: {
            where: { isCover: true },
            take: 1,
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
            where: { userId },
            select: { userId: true },
          },
          savedBy: {
            where: { userId },
            select: { userId: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: perPage,
        skip: skip,
      }),
      prisma.post.count({
        where: whereClause,
      }),
    ]);

    // 3. Parallel Processing for S3 URL Signing
    // We process all posts simultaneously for better performance
    const getSignedUrl = async (url: string | null | undefined) => {
      if (!url) return null;
      // Skip signing if it's a Google avatar or already a full external URL
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
    };
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        // Sign both the cover image and the user avatar in parallel
        const [signedCoverImageUrl, signedUserAvatar] = await Promise.all([
          getSignedUrl(post.images[0]?.url),
          getSignedUrl(post.user.avatar),
        ]);

        return {
          id: post.id,
          title: post.title,
          description: post.description,
          category: post.category,
          // Explicitly mapping visibility and draft status
          visibility: post.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
          isDraft: post.isDraft,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          user: {
            ...post.user,
            avatar: signedUserAvatar, // Fixed: Now using signed URL
          },
          coverImage: signedCoverImageUrl,
          images: post.images.map((img) => ({
            id: img.id,
            url: signedCoverImageUrl || img.url,
            description: null,
            isCover: img.isCover,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          })),
          tags: post.tags.map((t) => t.tag.name),
          _count: post._count,
          isLiked: post.likes.length > 0,
          isSaved: post.savedBy.length > 0,
          linkTo: `/posts/${post.id}`,
        };
      }),
    );

    const totalPages = Math.ceil(totalPosts / perPage);

    return {
      success: true,
      message: "Posts retrieved successfully",
      data: {
        posts: postsWithSignedUrls,
        pagination: {
          currentPage: page,
          perPage,
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        currentUserId: userId,
      },
    };
  } catch (error) {
    console.error("getMyPosts Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching your posts",
      code: "FETCH_MY_POSTS_FAILED",
      data: {
        posts: [],
        pagination: {
          currentPage: 1,
          perPage: 10,
          totalPages: 0,
          totalPosts: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        currentUserId: "",
      },
    };
  }
}

// Optional: Function to get post counts by category
export async function getMyPostsStats() {
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

    const stats = await prisma.post.groupBy({
      by: ["category"],
      where: {
        userId,
        isDraft: false,
      },
      _count: {
        _all: true,
      },
    });

    return {
      success: true,
      message: "Post stats retrieved successfully",
      data: stats,
    };
  } catch (error) {
    console.error("Error fetching post stats:", error);
    return {
      success: false,
      message: "Failed to fetch post statistics",
      code: "FETCH_STATS_FAILED",
    };
  }
}
