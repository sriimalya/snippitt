"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
async function getSignedAvatar(url: string | null | undefined) {
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

export async function getExploreUsers(
  page: number = 0,
  searchQuery: string = "",
) {
  const PAGE_SIZE = 50;

  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // 1. Fetch users with optional search and pagination
    const usersData = await prisma.user.findMany({
      where: {
        // Exclude the logged-in user from the explore list
        NOT: { id: currentUserId },
        // If searchQuery exists, filter by username (case-insensitive)
        ...(searchQuery
          ? {
              username: {
                contains: searchQuery,
                mode: "insensitive",
              },
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      orderBy: {
        // Showing newest users first, or you can order by username
        createdAt: "desc",
      },
    });

    // 2. Transform and Sign Avatars
    const users = await Promise.all(
      usersData.map(async (user) => ({
        id: user.id,
        username: user.username,
        avatar: await getSignedAvatar(user.avatar),
      })),
    );

    // 3. Return data and a flag to indicate if there might be more
    return {
      success: true,
      data: users,
      hasMore: users.length === PAGE_SIZE,
    };
  } catch (error) {
    console.error("getExploreUsers Error:", error);
    return { success: false, message: "Failed to fetch users", data: [] };
  }
}
