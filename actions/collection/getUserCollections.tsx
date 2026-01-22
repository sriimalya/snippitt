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
}

export async function getUserCollections(options: GetCollectionsOptions = {}) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Default to the logged-in user if no specific userId is provided
    const targetUserId = options.userId || currentUserId;

    if (!targetUserId) {
      return { success: false, message: "User not found", code: "NOT_FOUND" };
    }

    const page = options.page || 1;
    const perPage = options.perPage || 12; // 4x3 grid friendly
    const skip = (page - 1) * perPage;

    const isOwner = currentUserId === targetUserId;

    // 1. Visibility Logic
    // Owners see everything. Others see PUBLIC or FOLLOWERS (if following).
    let visibilityFilter: any = {};

    if (!isOwner) {
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

      visibilityFilter = {
        isDraft: false,
        OR: [
          { visibility: "PUBLIC" },
          ...(isFollowing ? [{ visibility: "FOLLOWERS" }] : []),
        ],
      };
    }

    // 2. Fetch Data
    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where: {
          userId: targetUserId,
          ...visibilityFilter,
        },
        include: {
          _count: {
            select: { posts: true },
          },
          user: {
            select: { id: true, username: true, avatar: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.collection.count({
        where: {
          userId: targetUserId,
          ...visibilityFilter,
        },
      }),
    ]);

    // 3. Transform and Sign Cover Images
    const transformedCollections: Collection[] = await Promise.all(
      collections.map(async (col) => {
        let signedCover = null;
        if (col.coverImage) {
          try {
            const key = extractKeyFromUrl(col.coverImage);
            signedCover = await generatePresignedViewUrl(key);
          } catch (e) {
            signedCover = col.coverImage;
          }
        }

        return {
          id: col.id,
          name: col.name,
          description: col.description,
          coverImage: signedCover,
          visibility: col.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
          isDraft: col.isDraft,
          createdAt: col.createdAt,
          updatedAt: col.updatedAt,
          user: col.user,
          _count: {
            posts: col._count.posts,
          },
        };
      })
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
    console.error("getMyCollections Error:", error);
    return { success: false, message: "Failed to fetch collections" };
  }
}