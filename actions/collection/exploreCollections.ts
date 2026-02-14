"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

async function getSignedUrl(url: string | null | undefined) {
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
}

export async function getExploreCollections(
  page: number = 0,
  query: string = "",
) {
  const PAGE_SIZE = 12; // Collections are bigger, so a smaller batch is better
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Visibility Filter Logic
    const visibilityFilter = {
      isDraft: false,
      OR: [
        { visibility: "PUBLIC" as any },
        ...(currentUserId
          ? [
              {
                visibility: "FOLLOWERS" as any,
                user: {
                  followers: { some: { followerId: currentUserId } },
                },
              },
            ]
          : []),
      ],
    };

    const rawCollections = await prisma.collection.findMany({
      where: {
        ...visibilityFilter,
        ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { posts: true } },
      },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      orderBy: { updatedAt: "desc" },
    });

    const collections = await Promise.all(
      rawCollections.map(async (col) => ({
        ...col,
        coverImage: await getSignedUrl(col.coverImage),
        user: {
          ...col.user,
          avatar: await getSignedUrl(col.user.avatar),
        },
      })),
    );

    return {
      success: true,
      data: collections,
      hasMore: collections.length === PAGE_SIZE,
    };
  } catch (error) {
    console.error("Explore Collections Error:", error);
    return { success: false, data: [] };
  }
}
