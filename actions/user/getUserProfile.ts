"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

/**
 * Reusable helper to handle both S3 and External (Google) URLs
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
    console.error("S3 Signing failed for URL:", url);
    return url; // Fallback
  }
}

export async function getUserProfile({ profileId }: { profileId: string }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const isOwner = currentUserId === profileId;

    // 1. Fetch User Identity & Social Stats
    const user = await prisma.user.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            followings: true,
            posts: { where: { isDraft: false } },
            collections: { where: { isDraft: false } },
          },
        },
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { followerId: true },
            }
          : false,
      },
    });

    if (!user) {
      return { success: false, message: "User not found", code: "NOT_FOUND" };
    }

    // 2. Content Visibility Logic
    const isFollowing = user.followers && user.followers.length > 0;
    const visibilityFilter = isOwner
      ? {}
      : {
          isDraft: false,
          OR: [
            { visibility: "PUBLIC" as any },
            ...(isFollowing ? [{ visibility: "FOLLOWERS" as any }] : []),
          ],
        };

    // 3. Parallel Data Fetching
    const [categoryStats, rawPosts, rawCollections] = await Promise.all([
      prisma.post.groupBy({
        by: ["category"],
        where: { userId: profileId, isDraft: false },
        _count: { _all: true },
      }),
      prisma.post.findMany({
        where: { userId: profileId, ...visibilityFilter },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          images: { where: { isCover: true }, take: 1 },
          tags: { include: { tag: true } },
          _count: { select: { likes: true, comments: true, savedBy: true } },
          likes: currentUserId ? { where: { userId: currentUserId } } : false,
          savedBy: currentUserId ? { where: { userId: currentUserId } } : false,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.collection.findMany({
        where: { userId: profileId, ...visibilityFilter },
        include: {
          _count: { select: { posts: true } },
          user: { select: { id: true, username: true, avatar: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    // 4. Transform and Sign Everything (Avatar, Posts, Collections)
    const [signedProfileAvatar, posts, collections] = await Promise.all([
      getValidImageUrl(user.avatar), // Main Profile Avatar

      Promise.all(
        rawPosts.map(async (p) => {
          const cover = p.images[0];
          const signedCoverUrl = await getValidImageUrl(cover?.url);
          const signedAuthorAvatar = await getValidImageUrl(p.user.avatar); // Post Author Avatar

          return {
            ...p,
            visibility: p.visibility as any,
            coverImage: signedCoverUrl,
            user: { ...p.user, avatar: signedAuthorAvatar },
            tags: p.tags.map((t) => t.tag.name),
            isLiked: currentUserId ? p.likes.length > 0 : false,
            isSaved: currentUserId ? p.savedBy.length > 0 : false,
            linkTo: `/post/${p.id}`,
          };
        }),
      ),

      Promise.all(
        rawCollections.map(async (c) => {
          const signedCollectionCover = await getValidImageUrl(c.coverImage);
          const signedCollectionAuthorAvatar = await getValidImageUrl(
            c.user.avatar,
          );

          return {
            ...c,
            visibility: c.visibility as any,
            coverImage: signedCollectionCover,
            user: { ...c.user, avatar: signedCollectionAuthorAvatar },
            _count: { posts: c._count.posts },
          };
        }),
      ),
    ]);

    return {
      success: true,
      data: {
        profile: {
          ...user,
          avatar: signedProfileAvatar,
          isFollowing: !!isFollowing,
          isOwner,
        },
        categoryStats,
        initialPosts: posts,
        initialCollections: collections,
        currentUserId: currentUserId || null,
      },
    };
  } catch (error) {
    console.error("getUserProfile Error:", error);
    return { success: false, message: "Failed to load profile" };
  }
}
