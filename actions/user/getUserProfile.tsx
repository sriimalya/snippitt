"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { enhancePostsWithSignedUrls, extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws-s3";

type Visibility = 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS';

type UserProfileResponse = {
    success: boolean;
    data?: {
        profile: {
            id: string;
            username: string;
            avatar: string | null;
            bio: string | null;
            joinDate: Date;
            stats: {
                totalPosts: number;
                publicPosts: number;
                privatePosts: number;
                followersPosts: number;
                visiblePosts: number;
                followers: number;
                following: number;
                collections: number;
            };
        };
        posts: {
            items: Array<{
                id: string;
                title: string;
                description: string;
                category: string;
                coverImage: string | null;
                visibility: Visibility;
                createdAt: Date;
                _count: {
                    likes: number;
                    comments: number;
                };
            }>;
            total: number;
            page: number;
            hasMore: boolean;
        };
        highlights: {
            items: Array<{
                id: string;
                notes: string | null;
                createdAt: Date;
                post: {
                    id: string;
                    title: string;
                    coverImage: string | null;
                    category: string;
                };
            }>;
            total: number;
            page: number;
            hasMore: boolean;
        };
        permissions: {
            canSeePrivatePosts: boolean;
            canSeeFollowersPosts: boolean;
        };
    };
    error?: {
        message: string;
        code: string;
    };
};

export async function getUserProfile({
  userId,
  postsPage = 1,
  highlightsPage = 1,
  postsPerPage = 6,
  highlightsPerPage = 5,
}: {
  userId: string;
  postsPage?: number;
  highlightsPage?: number;
  postsPerPage?: number;
  highlightsPerPage?: number;
}): Promise<UserProfileResponse> {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: { message: "Invalid user ID", code: "INVALID_INPUT" } };
  }

  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
    }

    const currentUserId = session?.id;
    const isOwnProfile = currentUserId === userId;

    // Check following status
    const isFollowing = currentUserId
      ? !!(await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
        }))
      : false;

    // Define visibility filter
    const visiblePostFilter = isOwnProfile
      ? {}
      : isFollowing
      ? { OR: [{ visibility: "PUBLIC" as Visibility }, { visibility: "FOLLOWERS" as Visibility }] }
      : { visibility: "PUBLIC" as Visibility };

    // ONE Massive Parallel Fetch
    const [
      user,
      publicPostCount,
      followersPostCount,
      privatePostCount,
      visiblePostCount,
      posts,
      highlights,
      totalHighlights,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          createdAt: true,
          _count: { select: { followers: true, followings: true, collections: true } },
        },
      }),
      prisma.post.count({ where: { userId, isDraft: false, visibility: "PUBLIC" } }),
      prisma.post.count({ where: { userId, isDraft: false, visibility: "FOLLOWERS" } }),
      prisma.post.count({ where: { userId, isDraft: false, visibility: "PRIVATE" } }),
      prisma.post.count({ where: { userId, isDraft: false, ...visiblePostFilter } }),
      prisma.post.findMany({
        where: { userId, isDraft: false, ...visiblePostFilter },
        include: {
          user: { select: { id: true, username: true, avatar: true } }, // Included for Snippet
          _count: { select: { likes: true, comments: true } },
          likes: currentUserId ? { where: { userId: currentUserId } } : false, // ✅ Dynamic isLiked
          savedBy: currentUserId ? { where: { userId: currentUserId } } : false, // ✅ Dynamic isSaved
        },
        orderBy: { createdAt: "desc" },
        skip: (postsPage - 1) * postsPerPage,
        take: postsPerPage,
      }),
      prisma.highlightedPost.findMany({
        where: { userId },
        include: {
          post: { select: { id: true, title: true, coverImage: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (highlightsPage - 1) * highlightsPerPage,
        take: highlightsPerPage,
      }),
      prisma.highlightedPost.count({ where: { userId } }),
    ]);

    if (!user) {
      return { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } };
    }

    // --- S3 SIGNING HELPER ---
    const signUrl = async (url: string | null) => {
      if (!url) return null;
      try {
        return await generatePresignedViewUrl(extractKeyFromUrl(url));
      } catch { return url; }
    };

    // --- PARALLEL PROCESSING ---
    const [signedAvatar, signedPosts, signedHighlights] = await Promise.all([
      signUrl(user.avatar),
      Promise.all(posts.map(async (post) => {
        const [pCover, uAvatar] = await Promise.all([
          signUrl(post.coverImage),
          signUrl(post.user.avatar)
        ]);
        return {
          ...post,
          coverImage: pCover,
          createdAt: post.createdAt.toISOString(),
          isLiked: post.likes.length > 0, // ✅ Map to boolean
          isSaved: post.savedBy.length > 0, // ✅ Map to boolean
          user: { ...post.user, avatar: uAvatar }
        };
      })),
      Promise.all(highlights.map(async (h) => ({
        ...h,
        post: { ...h.post, coverImage: await signUrl(h.post.coverImage) }
      })))
    ]);

    return {
      success: true,
      data: {
        profile: {
          id: user.id,
          username: user.username,
          avatar: signedAvatar,
          bio: user.bio,
          joinDate: user.createdAt,
          stats: {
            totalPosts: publicPostCount + followersPostCount + privatePostCount,
            publicPosts: publicPostCount,
            privatePosts: privatePostCount,
            followersPosts: followersPostCount,
            visiblePosts: visiblePostCount,
            followers: user._count.followers,
            following: user._count.followings,
            collections: user._count.collections,
          },
        },
        posts: {
          items: signedPosts,
          total: visiblePostCount,
          page: postsPage,
          hasMore: postsPage * postsPerPage < visiblePostCount,
        },
        highlights: {
          items: signedHighlights,
          total: totalHighlights,
          page: highlightsPage,
          hasMore: highlightsPage * highlightsPerPage < totalHighlights,
        },
        permissions: {
          canSeePrivatePosts: isOwnProfile,
          canSeeFollowersPosts: isFollowing || isOwnProfile,
        },
      },
    };
  } catch (error) {
    console.error("Profile fetch error:", error);
    return { success: false, error: { message: "Internal server error", code: "SERVER_ERROR" } };
  }
}