"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
import { Collection } from "@/types";

interface GetCollectionsOptions {
  page?: number;
  perPage?: number;
  userId?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "FOLLOWERS" | "DRAFT";
}

// Reusable signing helper to handle logic in one place
async function getSignedUrl(url: string | null | undefined) {
  if (!url) return null;
  const isExternal =
    url.includes("googleusercontent.com") ||
    (url.includes("http") && !url.includes("amazonaws.com"));
  if (isExternal) return url;

  try {
    const key = extractKeyFromUrl(url);
    return await generatePresignedViewUrl(key);
  } catch (error) {
    console.error("S3 Signing failed for URL:", url);
    return url; // Fallback to raw URL
  }
}

export async function getUserCollections(options: GetCollectionsOptions = {}) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const targetUserId = options.userId || currentUserId;

    if (!targetUserId) {
      return { success: false, message: "User not found", code: "NOT_FOUND" };
    }

    const page = options.page || 1;
    const perPage = options.perPage || 12;
    const skip = (page - 1) * perPage;

    const isOwner = currentUserId === targetUserId;

    const whereClause: any = {
      userId: targetUserId,
    };

    if (isOwner) {
      if (!options.visibility) {
        // ALL
        whereClause.isDraft = false;
      } else if (options.visibility === "DRAFT") {
        whereClause.isDraft = true;
      } else {
        whereClause.visibility = options.visibility;
        whereClause.isDraft = false;
      }
    } else {
      let isFollowing = false;

      if (currentUserId) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: targetUserId,
            },
          },
        });

        isFollowing = !!follow;
      }

      whereClause.isDraft = false;
      whereClause.OR = [
        { visibility: "PUBLIC" },
        ...(isFollowing ? [{ visibility: "FOLLOWERS" }] : []),
      ];
    }

    // 2. Fetch Data
    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where: whereClause,
        include: {
          _count: { select: { posts: true } },
          user: { select: { id: true, username: true, avatar: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.collection.count({
        where: whereClause,
      }),
    ]);

    // 3. Transform and Sign EVERYTHING in parallel
    const transformedCollections: Collection[] = await Promise.all(
      collections.map(async (col) => {
        // VVIP Fix: Sign both URLs at the same time for maximum speed
        const [signedCover, signedAvatar] = await Promise.all([
          getSignedUrl(col.coverImage),
          getSignedUrl(col.user.avatar),
        ]);

        return {
          id: col.id,
          name: col.name,
          description: col.description,
          coverImage: signedCover,
          visibility: col.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
          isDraft: col.isDraft,
          createdAt: col.createdAt,
          updatedAt: col.updatedAt,
          user: {
            ...col.user,
            avatar: signedAvatar, // FIXED: Now using the signed S3 URL
          },
          _count: {
            posts: col._count.posts,
          },
        };
      }),
    );

    return {
      success: true,
      data: {
        collections: transformedCollections,
        pagination: {
          total,
          pages: Math.ceil(total / perPage),
          currentPage: page,
        },
        isOwner,
      },
    };
  } catch (error) {
    console.error("getUserCollections Error:", error);
    return { success: false, message: "Failed to fetch collections" };
  }
}
