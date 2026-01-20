// actions/posts/getMyPosts.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";

import type { Post } from "@/schemas/post";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

interface GetMyPostsOptions {
  page?: number; // Page number (starting from 1)
  perPage?: number; // Posts per page (default 10)
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

    // Build where clause - only non-draft posts
    const whereClause: any = {
      userId,
      isDraft: false, // Exclude drafts
    };

    // Filter by category if provided
    if (options.category) {
      whereClause.category = options.category;
    }

    // Fetch posts with pagination and all necessary relations
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
            where: {
              isCover: true, // Only fetch cover images for feed
            },
            take: 1,
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              savedBy: true,
            },
          },
          // Check if current user has liked or saved each post
          likes: {
            where: {
              userId: userId,
            },
            select: {
              userId: true,
            },
          },
          savedBy: {
            where: {
              userId: userId,
            },
            select: {
              userId: true,
            },
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

    // Transform posts with signed URLs and engagement data
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        const coverImage = post.images[0];
        let signedCoverImageUrl = null;

        // Generate signed URL for cover image
        if (coverImage?.url) {
          try {
            const key = extractKeyFromUrl(coverImage.url);
            signedCoverImageUrl = await generatePresignedViewUrl(key);
          } catch (error) {
            console.error(
              `Failed to sign cover image for post ${post.id}:`,
              error,
            );
          }
        }

        // Check if current user has engaged with this post
        const hasLiked = post.likes.some((like) => like.userId === userId);
        const hasSaved = post.savedBy.some((saved) => saved.userId === userId);

        // Create Post object matching Snippet component requirements
        const postData: Post = {
          id: post.id,
          title: post.title,
          description: post.description,
          category: post.category,
          visibility: post.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
          isDraft: post.isDraft,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,

          // User info
          user: {
            id: post.user.id,
            username: post.user.username,
            avatar: post.user.avatar,
          },

          // Cover image with signed URL
          coverImage: signedCoverImageUrl,
          images: post.images.map((img) => ({
            id: img.id,
            url: signedCoverImageUrl || img.url, // Use signed URL if available
            description: null, // Since we didn't select description in the query
            isCover: img.isCover,
            createdAt: post.createdAt, // Fallback since we didn't select createdAt for images
            updatedAt: post.updatedAt,
          })),
          // Tags
          tags: post.tags.map((t) => t.tag.name),

          // Counts
          _count: {
            likes: post._count.likes,
            comments: post._count.comments,
            savedBy: post._count.savedBy,
          },

          // User engagement flags (for Snippet component)
          isLiked: hasLiked,
          isSaved: hasSaved,

          // For navigation in Snippet component
          linkTo: `/dashboard/my-posts/${post.id}`,
        };

        return postData;
      }),
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalPosts / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      message: "Your posts retrieved successfully",
      data: {
        posts: postsWithSignedUrls,
        pagination: {
          currentPage: page,
          perPage: perPage,
          totalPages: totalPages,
          totalPosts: totalPosts,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
        },
        currentUserId: userId,
      },
    };
  } catch (error) {
    console.error("Error fetching your posts:", error);

    return {
      success: false,
      message: "An error occurred while fetching your posts",
      code: "FETCH_MY_POSTS_FAILED",
      data: {
        posts: [],
        pagination: {
          currentPage: options.page || 1,
          perPage: options.perPage || 10,
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
