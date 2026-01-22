"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
import { Post } from "@/schemas/post";
import { Collection } from "@/types";

interface GetProfileParams {
  profileId: string;
}

export async function getUserProfile({ profileId }: GetProfileParams) {
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
        avatar: true, // This is the raw S3 URL/Key
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

    // --- NEW: Sign the User Avatar URL ---
    let signedAvatar = user.avatar;
    if (user.avatar) {
      try {
        const avatarKey = extractKeyFromUrl(user.avatar);
        signedAvatar = await generatePresignedViewUrl(avatarKey);
      } catch (e) {
        console.error("Error signing avatar:", e);
        // Fallback to original if signing fails
      }
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
          likes: currentUserId
            ? { where: { userId: currentUserId }, select: { userId: true } }
            : false,
          savedBy: currentUserId
            ? { where: { userId: currentUserId }, select: { userId: true } }
            : false,
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

    // 4. Transform and Sign URLs for Posts
    const posts: Post[] = await Promise.all(
      rawPosts.map(async (p) => {
        let signedUrl = null;
        const cover = p.images[0];
        if (cover?.url) {
          signedUrl = await generatePresignedViewUrl(extractKeyFromUrl(cover.url));
        }
        return {
          ...p,
          visibility: p.visibility as any,
          coverImage: signedUrl,
          images: p.images.map((img) => ({
            ...img,
            url: signedUrl || img.url,
          })),
          tags: p.tags.map((t) => t.tag.name),
          isLiked: currentUserId ? p.likes.length > 0 : false,
          isSaved: currentUserId ? p.savedBy.length > 0 : false,
          linkTo: `/explore/post/${p.id}`,
        };
      }),
    );

    // 5. Transform and Sign URLs for Collections
    const collections: Collection[] = await Promise.all(
      rawCollections.map(async (c) => {
        let signedCover = null;
        if (c.coverImage) {
          signedCover = await generatePresignedViewUrl(extractKeyFromUrl(c.coverImage));
        }
        return {
          ...c,
          visibility: c.visibility as any,
          coverImage: signedCover,
          _count: { posts: c._count.posts },
        };
      }),
    );

    return {
      success: true,
      data: {
        profile: {
          ...user,
          avatar: signedAvatar, // Use the signed version
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