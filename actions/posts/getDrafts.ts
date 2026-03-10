"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";

import type { Post } from "@/schemas/post";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

interface GetDraftPostsOptions {
  page?: number;
  perPage?: number;
  category?: string;
  search?: string;
  sort?: "asc" | "desc";
}

export async function getDraftPosts(
  options: GetDraftPostsOptions = {},
): Promise<{
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
        message: "You must be logged in to view drafts",
        code: "UNAUTHORIZED",
      };
    }

    const userId = session.user.id;

    const perPage = options.perPage || 10;
    const page = options.page || 1;
    const skip = (page - 1) * perPage;

    const whereClause: any = {
      userId,
      isDraft: true,
    };

    if (options.category) {
      whereClause.category = options.category;
    }

    if (options.search) {
      whereClause.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

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
          updatedAt: options.sort || "desc",
        },
        take: perPage,
        skip,
      }),
      prisma.post.count({
        where: whereClause,
      }),
    ]);

    const getSignedUrl = async (url: string | null | undefined) => {
      if (!url) return null;

      const isExternal =
        url.includes("googleusercontent.com") ||
        (url.includes("http") && !url.includes("amazonaws.com"));

      if (isExternal) return url;

      try {
        const key = extractKeyFromUrl(url);
        return await generatePresignedViewUrl(key);
      } catch {
        return url;
      }
    };

    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        const [signedCoverImageUrl, signedUserAvatar] = await Promise.all([
          getSignedUrl(post.images[0]?.url),
          getSignedUrl(post.user.avatar),
        ]);

        return {
          id: post.id,
          title: post.title,
          description: post.description,
          category: post.category,
          visibility: post.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
          isDraft: post.isDraft,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          user: {
            ...post.user,
            avatar: signedUserAvatar,
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
      message: "Draft posts retrieved successfully",
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
    console.error("getDraftPosts Error:", error);

    return {
      success: false,
      message: "An error occurred while fetching drafts",
      code: "FETCH_DRAFT_POSTS_FAILED",
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
